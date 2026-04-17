import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { getJwtToken, cleanDatabase, seedPlatformModules } from './test-utils';

describe('PlatformAdminController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    await seedPlatformModules(prisma);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should perform full tenant lifecycle as super_admin', async () => {
    const token = getJwtToken(app, {
      userId: '1',
      username: 'superadmin',
      role: 'super_admin',
      modules: [],
    });

    // 1. Create tenant
    const createRes = await request(app.getHttpServer())
      .post('/admin/platform/tenants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tenantCode: 'e2ecorp',
        tenantName: 'E2E测试企业',
        subscriptionPlan: 'professional',
        expireDate: '2027-12-31T23:59:59.000Z',
        maxUsers: 10,
        adminUsername: 'e2eadmin',
        adminPassword: 'e2e123',
      })
      .expect(201);

    const tenantId = createRes.body.id;
    expect(createRes.body.tenantCode).toBe('e2ecorp');

    // 2. Get tenant detail
    await request(app.getHttpServer())
      .get(`/admin/platform/tenants/${tenantId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.tenantCode).toBe('e2ecorp');
        expect(res.body.users).toBeDefined();
        expect(res.body.licenses).toBeDefined();
      });

    // 3. Assign license
    await request(app.getHttpServer())
      .post(`/admin/platform/licenses/${tenantId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ moduleCode: 'ehs', status: 'active' })
      .expect(201)
      .expect((res) => {
        expect(res.body.moduleCode).toBe('ehs');
        expect(res.body.status).toBe('active');
      });

    // 4. Update tenant
    await request(app.getHttpServer())
      .put(`/admin/platform/tenants/${tenantId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tenantName: 'E2E测试企业-更新' })
      .expect(200)
      .expect((res) => {
        expect(res.body.tenantName).toBe('E2E测试企业-更新');
      });

    // 5. List tenants
    await request(app.getHttpServer())
      .get('/admin/platform/tenants')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        expect(res.body.total).toBeGreaterThanOrEqual(1);
      });
  });

  it('should reject tenant_admin accessing platform endpoints', async () => {
    const token = getJwtToken(app, {
      userId: '2',
      username: 'tenantadmin',
      role: 'tenant_admin',
      modules: [],
    });

    await request(app.getHttpServer())
      .get('/admin/platform/tenants')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('should reject unauthenticated request', async () => {
    await request(app.getHttpServer())
      .get('/admin/platform/tenants')
      .expect(401);
  });
});
