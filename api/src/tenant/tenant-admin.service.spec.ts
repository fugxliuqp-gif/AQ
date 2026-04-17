import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { TenantAdminService } from './tenant-admin.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TenantAdminService', () => {
  let service: TenantAdminService;
  const tenantId = 1n;
  const createdBy = 2n;

  const mockPrisma = {
    tenant: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    tenantModuleLicense: {
      findMany: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    rolePermission: {
      deleteMany: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userRole: {
      deleteMany: jest.fn(),
    },
    userModulePermission: {
      deleteMany: jest.fn(),
    },
    userDataScope: {
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantAdminService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TenantAdminService>(TenantAdminService);
    jest.clearAllMocks();
  });

  describe('createRole', () => {
    it('should create role with permissions when moduleCodes are licensed', async () => {
      mockPrisma.tenantModuleLicense.findMany.mockResolvedValue([
        { moduleCode: 'ehs' },
        { moduleCode: 'ai_chat' },
      ]);
      mockPrisma.role.create.mockResolvedValue({
        id: 1n,
        roleName: '安全管理员',
      });

      const result = await service.createRole(
        tenantId,
        { roleName: '安全管理员', description: 'desc', moduleCodes: ['ehs'] },
        createdBy,
      );

      expect(result.roleName).toBe('安全管理员');
      expect(mockPrisma.role.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            roleName: '安全管理员',
            permissions: {
              create: [{ moduleCode: 'ehs', actions: ['read', 'execute'] }],
            },
          }),
        }),
      );
    });

    it('should throw BadRequestException for unlicensed moduleCodes', async () => {
      mockPrisma.tenantModuleLicense.findMany.mockResolvedValue([
        { moduleCode: 'ehs' },
      ]);

      await expect(
        service.createRole(
          tenantId,
          { roleName: '非法角色', moduleCodes: ['unlicensed'] },
          createdBy,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateRole', () => {
    it('should replace permissions when updating role', async () => {
      mockPrisma.role.findFirst.mockResolvedValue({ id: 1n, tenantId });
      mockPrisma.tenantModuleLicense.findMany.mockResolvedValue([
        { moduleCode: 'equipment' },
      ]);
      mockPrisma.rolePermission.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.role.update.mockResolvedValue({ id: 1n, roleName: 'Updated' });

      const result = await service.updateRole(tenantId, 1n, {
        roleName: 'Updated',
        moduleCodes: ['equipment'],
      });

      expect(mockPrisma.rolePermission.deleteMany).toHaveBeenCalledWith({
        where: { roleId: 1n },
      });
      expect(result.roleName).toBe('Updated');
    });

    it('should throw BadRequestException when role not found', async () => {
      mockPrisma.role.findFirst.mockResolvedValue(null);

      await expect(
        service.updateRole(tenantId, 999n, { roleName: 'x' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteRole', () => {
    it('should delete role and cascade relations', async () => {
      mockPrisma.role.findFirst.mockResolvedValue({
        id: 1n,
        tenantId,
        isDefault: false,
      });
      mockPrisma.userRole.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.rolePermission.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.role.delete.mockResolvedValue({ id: 1n });

      const result = await service.deleteRole(tenantId, 1n);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.userRole.deleteMany).toHaveBeenCalledWith({
        where: { roleId: 1n },
      });
      expect(mockPrisma.role.delete).toHaveBeenCalledWith({
        where: { id: 1n },
      });
    });

    it('should throw ForbiddenException for default role', async () => {
      mockPrisma.role.findFirst.mockResolvedValue({
        id: 1n,
        tenantId,
        isDefault: true,
      });

      await expect(service.deleteRole(tenantId, 1n)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('createUser', () => {
    it('should create user with default role tenant_user', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        maxUsers: 10,
        _count: { users: 2 },
      });
      mockPrisma.user.create.mockResolvedValue({
        id: 3n,
        username: 'newuser',
        role: 'tenant_user',
      });

      const result = await service.createUser(
        tenantId,
        { username: 'newuser', password: 'pass123' },
        createdBy,
      );

      expect(result.role).toBe('tenant_user');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'tenant_user',
            passwordHash: expect.any(String),
          }),
        }),
      );
    });

    it('should throw ForbiddenException when exceeding maxUsers', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        maxUsers: 2,
        _count: { users: 2 },
      });

      await expect(
        service.createUser(
          tenantId,
          { username: 'newuser', password: 'pass123' },
          createdBy,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create user with roleIds and moduleCodes', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        maxUsers: 10,
        _count: { users: 1 },
      });
      mockPrisma.user.create.mockResolvedValue({ id: 5n, username: 'u5' });

      await service.createUser(
        tenantId,
        {
          username: 'u5',
          password: 'p5',
          roleIds: [1, 2],
          moduleCodes: ['ehs'],
          dataScopes: [{ scopeType: 'dept', scopeId: 10n, scopeName: 'A' }],
        },
        createdBy,
      );

      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.userRoles.create).toEqual([
        { roleId: 1n, assignedBy: createdBy },
        { roleId: 2n, assignedBy: createdBy },
      ]);
      expect(createCall.data.modulePerms.create).toEqual([
        { moduleCode: 'ehs', status: 'granted', grantedBy: createdBy },
      ]);
      expect(createCall.data.dataScopes.create).toEqual([
        { scopeType: 'dept', scopeId: 10n, scopeName: 'A' },
      ]);
    });
  });

  describe('updateUser', () => {
    it('should replace all relations when updating user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 3n, tenantId });
      mockPrisma.userModulePermission.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.userDataScope.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.userRole.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.user.update.mockResolvedValue({ id: 3n, realName: 'Updated' });

      const result = await service.updateUser(
        tenantId,
        3n,
        { realName: 'Updated', roleIds: [1], moduleCodes: ['ai_chat'] },
        createdBy,
      );

      expect(mockPrisma.userModulePermission.deleteMany).toHaveBeenCalledWith({
        where: { userId: 3n },
      });
      expect(mockPrisma.userRole.deleteMany).toHaveBeenCalledWith({
        where: { userId: 3n },
      });
      expect(result.realName).toBe('Updated');
    });
  });
});
