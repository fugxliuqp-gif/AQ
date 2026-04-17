import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { APP_GUARD } from '@nestjs/core';
import { PlatformAdminTenantsController } from './tenants.controller';
import { PlatformAdminModulesController } from './modules.controller';
import { PlatformAdminLicensesController } from './licenses.controller';
import { PlatformAdminService } from './platform-admin.service';
import { RolesGuard } from '../common/guards/roles.guard';

describe('PlatformAdminControllers', () => {
  let app: INestApplication;
  const mockService = {
    listTenants: jest.fn(),
    createTenant: jest.fn(),
    updateTenant: jest.fn(),
    getTenantById: jest.fn(),
    listModules: jest.fn(),
    createModule: jest.fn(),
    updateModule: jest.fn(),
    getTenantLicenses: jest.fn(),
    upsertLicense: jest.fn(),
  };

  const mockUser = {
    userId: '1',
    username: 'superadmin',
    role: 'super_admin',
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
      controllers: [
        PlatformAdminTenantsController,
        PlatformAdminModulesController,
        PlatformAdminLicensesController,
      ],
      providers: [
        { provide: PlatformAdminService, useValue: mockService },
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

  describe('TenantsController', () => {
    it('should list tenants', async () => {
      mockService.listTenants.mockResolvedValue({ data: [], total: 0 });
      await request(app.getHttpServer())
        .get('/admin/platform/tenants')
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toBe(0);
        });
      expect(mockService.listTenants).toHaveBeenCalledWith({ status: undefined, plan: undefined, skip: 0, take: 20 });
    });

    it('should create tenant with createdBy bigint', async () => {
      mockService.createTenant.mockResolvedValue({ id: '1', tenantCode: 'new' });
      await request(app.getHttpServer())
        .post('/admin/platform/tenants')
        .send({ tenantCode: 'new', tenantName: 'New' })
        .expect(201)
        .expect((res) => {
          expect(res.body.tenantCode).toBe('new');
        });
      expect(mockService.createTenant).toHaveBeenCalledWith(
        expect.objectContaining({ tenantCode: 'new', createdBy: 1n }),
      );
    });

    it('should get tenant by id', async () => {
      mockService.getTenantById.mockResolvedValue({ id: '1' });
      await request(app.getHttpServer())
        .get('/admin/platform/tenants/1')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe('1');
        });
      expect(mockService.getTenantById).toHaveBeenCalledWith(1n);
    });

    it('should update tenant', async () => {
      mockService.updateTenant.mockResolvedValue({ id: '1', tenantName: 'Updated' });
      await request(app.getHttpServer())
        .put('/admin/platform/tenants/1')
        .send({ tenantName: 'Updated' })
        .expect(200)
        .expect((res) => {
          expect(res.body.tenantName).toBe('Updated');
        });
      expect(mockService.updateTenant).toHaveBeenCalledWith(1n, { tenantName: 'Updated' });
    });
  });

  describe('ModulesController', () => {
    it('should list modules', async () => {
      mockService.listModules.mockResolvedValue([]);
      await request(app.getHttpServer())
        .get('/admin/platform/modules')
        .expect(200);
      expect(mockService.listModules).toHaveBeenCalled();
    });

    it('should create module', async () => {
      mockService.createModule.mockResolvedValue({ id: '1', moduleCode: 'ehs' });
      await request(app.getHttpServer())
        .post('/admin/platform/modules')
        .send({ moduleCode: 'ehs', moduleName: 'EHS' })
        .expect(201);
      expect(mockService.createModule).toHaveBeenCalledWith({ moduleCode: 'ehs', moduleName: 'EHS' });
    });

    it('should update module', async () => {
      mockService.updateModule.mockResolvedValue({ id: '1', moduleName: 'Updated' });
      await request(app.getHttpServer())
        .put('/admin/platform/modules/1')
        .send({ moduleName: 'Updated' })
        .expect(200);
      expect(mockService.updateModule).toHaveBeenCalledWith(1n, { moduleName: 'Updated' });
    });
  });

  describe('LicensesController', () => {
    it('should get licenses by tenantId', async () => {
      mockService.getTenantLicenses.mockResolvedValue([]);
      await request(app.getHttpServer())
        .get('/admin/platform/licenses/1')
        .expect(200);
      expect(mockService.getTenantLicenses).toHaveBeenCalledWith(1n);
    });

    it('should upsert license with date conversion', async () => {
      mockService.upsertLicense.mockResolvedValue({ id: '1' });
      await request(app.getHttpServer())
        .post('/admin/platform/licenses/1')
        .send({ moduleCode: 'ehs', status: 'active', expireDate: '2027-01-01', maxUsers: 100, customPrice: 1999 })
        .expect(201);
      expect(mockService.upsertLicense).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1n,
          moduleCode: 'ehs',
          status: 'active',
          expireDate: new Date('2027-01-01'),
          maxUsers: 100,
          customPrice: 1999,
        }),
      );
    });
  });
});
