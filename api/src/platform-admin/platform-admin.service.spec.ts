import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PlatformAdminService } from './platform-admin.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PlatformAdminService', () => {
  let service: PlatformAdminService;
  const mockPrisma = {
    tenant: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      create: jest.fn(),
    },
    platformModule: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    tenantModuleLicense: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformAdminService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PlatformAdminService>(PlatformAdminService);
    jest.clearAllMocks();
  });

  describe('listTenants', () => {
    it('should return paginated tenants with counts', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([
        {
          id: 1n,
          tenantCode: 'corp1',
          _count: { users: 5, licenses: 3 },
        },
      ]);
      mockPrisma.tenant.count.mockResolvedValue(1);

      const result = await service.listTenants({});

      expect(result.data[0].userCount).toBe(5);
      expect(result.data[0].moduleCount).toBe(3);
      expect(result.data[0]._count).toBeUndefined();
      expect(result.total).toBe(1);
    });

    it('should apply status and plan filters', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([]);
      mockPrisma.tenant.count.mockResolvedValue(0);

      await service.listTenants({ status: 'active', plan: 'professional', skip: 10, take: 5 });

      expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'active', subscriptionPlan: 'professional' },
          skip: 10,
          take: 5,
        }),
      );
    });
  });

  describe('createTenant', () => {
    it('should create tenant and default admin user', async () => {
      mockPrisma.tenant.create.mockResolvedValue({ id: 10n, tenantCode: 'newcorp' });
      mockPrisma.user.create.mockResolvedValue({ id: 99n, username: 'admin' });

      const result = await service.createTenant({
        tenantCode: 'newcorp',
        tenantName: 'New Corp',
        subscriptionPlan: 'basic',
        expireDate: '2027-01-01',
        maxUsers: 10,
        adminUsername: 'admin',
        adminPassword: 'pass123',
        createdBy: 1n,
      });

      expect(result).toMatchObject({ id: 10n, tenantCode: 'newcorp' });
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 10n,
            username: 'admin',
            role: 'tenant_admin',
            status: 'active',
            passwordHash: expect.any(String),
          }),
        }),
      );
    });
  });

  describe('updateTenant', () => {
    it('should strip frontend illegal fields and convert types', async () => {
      mockPrisma.tenant.update.mockResolvedValue({ id: 1n, tenantName: 'Updated' });

      const result = await service.updateTenant(1n, {
        id: 'x',
        createdAt: 'x',
        updatedAt: 'x',
        userCount: 99,
        moduleCount: 88,
        _count: {},
        tenantName: 'Updated',
        expireDate: '2026-06-01',
        maxUsers: '20',
      });

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 1n },
        data: {
          tenantName: 'Updated',
          expireDate: new Date('2026-06-01'),
          maxUsers: 20,
        },
      });
      expect(result.tenantName).toBe('Updated');
    });
  });

  describe('getTenantById', () => {
    it('should return tenant with users and licenses', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 1n,
        users: [],
        licenses: [],
      });

      const result = await service.getTenantById(1n);
      expect(result.users).toBeDefined();
      expect(result.licenses).toBeDefined();
    });
  });

  describe('upsertLicense', () => {
    it('should upsert license with converted fields', async () => {
      mockPrisma.tenantModuleLicense.upsert.mockResolvedValue({ id: 1n });

      await service.upsertLicense({
        tenantId: 1n,
        moduleCode: 'ehs',
        status: 'active',
        expireDate: new Date('2027-01-01'),
        maxUsers: 100,
        customPrice: 1999,
      });

      expect(mockPrisma.tenantModuleLicense.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId_moduleCode: { tenantId: 1n, moduleCode: 'ehs' },
          },
          update: {
            status: 'active',
            expireDate: new Date('2027-01-01'),
            maxUsers: 100,
            customPrice: 1999,
          },
          create: {
            tenantId: 1n,
            moduleCode: 'ehs',
            status: 'active',
            expireDate: new Date('2027-01-01'),
            maxUsers: 100,
            customPrice: 1999,
          },
        }),
      );
    });
  });
});
