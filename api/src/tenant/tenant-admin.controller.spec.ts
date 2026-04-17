import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { APP_GUARD } from '@nestjs/core';
import { TenantAdminController } from './tenant-admin.controller';
import { TenantAdminService } from './tenant-admin.service';
import { RolesGuard } from '../common/guards/roles.guard';

describe('TenantAdminController', () => {
  let app: INestApplication;
  const mockService = {
    getTenantInfo: jest.fn(),
    listRoles: jest.fn(),
    createRole: jest.fn(),
    updateRole: jest.fn(),
    deleteRole: jest.fn(),
    listUsers: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    getUserModules: jest.fn(),
  };

  const mockUser = {
    userId: '2',
    username: 'tenantadmin',
    role: 'tenant_admin',
    tenantId: '1',
    tenantCode: 'testcorp',
    tenantStatus: 'active',
    modules: [],
  };

  class MockAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext) {
      const req = context.switchToHttp().getRequest();
      req.user = mockUser;
      return true;
    }
  }

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantAdminController],
      providers: [
        { provide: TenantAdminService, useValue: mockService },
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should call getTenantInfo with bigint tenantId', async () => {
    mockService.getTenantInfo.mockResolvedValue({ id: '1', tenantName: 'T' });

    await request(app.getHttpServer())
      .get('/admin/tenant/info')
      .expect(200)
      .expect((res) => {
        expect(res.body.tenantName).toBe('T');
      });
    expect(mockService.getTenantInfo).toHaveBeenCalledWith(1n);
  });

  it('should list roles', async () => {
    mockService.listRoles.mockResolvedValue([{ id: '1', roleName: 'Admin' }]);

    await request(app.getHttpServer())
      .get('/admin/tenant/roles')
      .expect(200)
      .expect((res) => {
        expect(res.body.length).toBe(1);
      });
    expect(mockService.listRoles).toHaveBeenCalledWith(1n);
  });

  it('should create role', async () => {
    mockService.createRole.mockResolvedValue({ id: '1', roleName: 'Role1' });
    const body = { roleName: 'Role1', moduleCodes: ['ehs'] };

    await request(app.getHttpServer())
      .post('/admin/tenant/roles')
      .send(body)
      .expect(201)
      .expect((res) => {
        expect(res.body.roleName).toBe('Role1');
      });
    expect(mockService.createRole).toHaveBeenCalledWith(1n, body, 2n);
  });

  it('should update role with id param', async () => {
    mockService.updateRole.mockResolvedValue({ id: '1', roleName: 'Updated' });
    const body = { roleName: 'Updated', moduleCodes: [] };

    await request(app.getHttpServer())
      .put('/admin/tenant/roles/1')
      .send(body)
      .expect(200)
      .expect((res) => {
        expect(res.body.roleName).toBe('Updated');
      });
    expect(mockService.updateRole).toHaveBeenCalledWith(1n, 1n, body);
  });

  it('should delete role with id param', async () => {
    mockService.deleteRole.mockResolvedValue({ success: true });

    await request(app.getHttpServer())
      .delete('/admin/tenant/roles/1')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
      });
    expect(mockService.deleteRole).toHaveBeenCalledWith(1n, 1n);
  });

  it('should list users with pagination', async () => {
    mockService.listUsers.mockResolvedValue({ data: [], total: 0 });

    await request(app.getHttpServer())
      .get('/admin/tenant/users?skip=0&take=10')
      .expect(200)
      .expect((res) => {
        expect(res.body.total).toBe(0);
      });
    expect(mockService.listUsers).toHaveBeenCalledWith(1n, { skip: 0, take: 10 });
  });

  it('should create user', async () => {
    mockService.createUser.mockResolvedValue({ id: '5', username: 'u5' });
    const body = { username: 'u5', password: 'p5', roleIds: [1] };

    await request(app.getHttpServer())
      .post('/admin/tenant/users')
      .send(body)
      .expect(201)
      .expect((res) => {
        expect(res.body.username).toBe('u5');
      });
    expect(mockService.createUser).toHaveBeenCalledWith(1n, body, 2n);
  });

  it('should update user', async () => {
    mockService.updateUser.mockResolvedValue({ id: '5', realName: 'Updated' });
    const body = { realName: 'Updated', roleIds: [1] };

    await request(app.getHttpServer())
      .put('/admin/tenant/users/5')
      .send(body)
      .expect(200)
      .expect((res) => {
        expect(res.body.realName).toBe('Updated');
      });
    expect(mockService.updateUser).toHaveBeenCalledWith(1n, 5n, body, 2n);
  });

  it('should get user modules', async () => {
    mockService.getUserModules.mockResolvedValue([{ moduleCode: 'ehs' }]);

    await request(app.getHttpServer())
      .get('/admin/tenant/modules')
      .expect(200)
      .expect((res) => {
        expect(res.body[0].moduleCode).toBe('ehs');
      });
    expect(mockService.getUserModules).toHaveBeenCalledWith(1n);
  });
});
