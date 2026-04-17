import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { getJwtToken, cleanDatabase, seedPlatformModules } from './test-utils';

describe('TenantAdminController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let superToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    await seedPlatformModules(prisma);
    superToken = getJwtToken(app, {
      userId: '1',
      username: 'superadmin',
      role: 'super_admin',
      modules: [],
    });
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  async function createTenantAndLicenses() {
    const tenantRes = await request(app.getHttpServer())
      .post('/admin/platform/tenants')
      .set('Authorization', `Bearer ${superToken}`)
      .send({
        tenantCode: 'tenant' + Date.now(),
        tenantName: 'Tenant Corp',
        subscriptionPlan: 'professional',
        expireDate: '2027-12-31T23:59:59.000Z',
        maxUsers: 5,
        adminUsername: 'tadmin',
        adminPassword: 'tadmin123',
      });
    const tenantId = tenantRes.body.id;

    await request(app.getHttpServer())
      .post(`/admin/platform/licenses/${tenantId}`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ moduleCode: 'ehs', status: 'active' });

    await request(app.getHttpServer())
      .post(`/admin/platform/licenses/${tenantId}`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ moduleCode: 'ai_chat', status: 'active' });

    return { tenantId };
  }

  it('should get tenant info and available modules', async () => {
    const { tenantId } = await createTenantAndLicenses();
    const token = getJwtToken(app, {
      userId: '2',
      username: 'tadmin',
      role: 'tenant_admin',
      tenantId: tenantId.toString(),
      tenantCode: 'test',
      tenantStatus: 'active',
      modules: [],
    });

    await request(app.getHttpServer())
      .get('/admin/tenant/info')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(tenantId);
        expect(res.body.licenses.length).toBe(2);
      });

    await request(app.getHttpServer())
      .get('/admin/tenant/modules')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        const codes = res.body.map((m: any) => m.moduleCode);
        expect(codes).toContain('ehs');
        expect(codes).toContain('ai_chat');
      });
  });

  it('should create role and reject unlicensed modules', async () => {
    const { tenantId } = await createTenantAndLicenses();
    const token = getJwtToken(app, {
      userId: '2',
      username: 'tadmin',
      role: 'tenant_admin',
      tenantId: tenantId.toString(),
      modules: [],
    });

    const roleRes = await request(app.getHttpServer())
      .post('/admin/tenant/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({ roleName: '安全员', moduleCodes: ['ehs'] })
      .expect(201);
    expect(roleRes.body.roleName).toBe('安全员');

    await request(app.getHttpServer())
      .post('/admin/tenant/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({ roleName: '非法角色', moduleCodes: ['unlicensed_module'] })
      .expect(400);
  });

  it('should enforce maxUsers quota', async () => {
    const tenantRes = await request(app.getHttpServer())
      .post('/admin/platform/tenants')
      .set('Authorization', `Bearer ${superToken}`)
      .send({
        tenantCode: 'quota' + Date.now(),
        tenantName: 'Quota Corp',
        subscriptionPlan: 'basic',
        expireDate: '2027-12-31T23:59:59.000Z',
        maxUsers: 1,
        adminUsername: 'qadmin',
        adminPassword: 'qadmin123',
      });
    const tenantId = tenantRes.body.id;

    const token = getJwtToken(app, {
      userId: '2',
      username: 'qadmin',
      role: 'tenant_admin',
      tenantId: tenantId.toString(),
      modules: [],
    });

    // default tenant_admin already counts as 1 user, so creating another should exceed quota
    await request(app.getHttpServer())
      .post('/admin/tenant/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'user1', password: 'p1' })
      .expect(403);
  });

  it('should complete role-user-permission closed loop', async () => {
    const { tenantId } = await createTenantAndLicenses();
    const tenantToken = getJwtToken(app, {
      userId: '2',
      username: 'tadmin',
      role: 'tenant_admin',
      tenantId: tenantId.toString(),
      modules: [],
    });

    // 1. Create role with ehs + ai_chat
    const roleRes = await request(app.getHttpServer())
      .post('/admin/tenant/roles')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({ roleName: '闭环测试角色', moduleCodes: ['ehs', 'ai_chat'] })
      .expect(201);
    const roleId = roleRes.body.id;

    // 2. Create user with the role
    await request(app.getHttpServer())
      .post('/admin/tenant/users')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        username: 'loopuser',
        password: 'loop123',
        realName: '闭环用户',
        roleIds: [roleId],
      })
      .expect(201);

    // 3. New user login and verify JWT modules
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'loopuser', password: 'loop123' })
      .expect(200);

    expect(loginRes.body.user.modules.sort()).toEqual(['ai_chat', 'ehs']);
    expect(loginRes.body.access_token).toBeDefined();

    // 4. Update role: remove ai_chat
    await request(app.getHttpServer())
      .put(`/admin/tenant/roles/${roleId}`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({ roleName: '闭环测试角色-改', moduleCodes: ['ehs'] })
      .expect(200);

    // 5. Login again, modules should only contain ehs
    const loginRes2 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'loopuser', password: 'loop123' })
      .expect(200);
    expect(loginRes2.body.user.modules).toEqual(['ehs']);

    // 6. Delete role
    await request(app.getHttpServer())
      .delete(`/admin/tenant/roles/${roleId}`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .expect(200);

    // 7. Login again, modules should be empty
    const loginRes3 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'loopuser', password: 'loop123' })
      .expect(200);
    expect(loginRes3.body.user.modules).toEqual([]);
  });
});
