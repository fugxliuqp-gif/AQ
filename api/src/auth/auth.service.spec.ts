import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    platformModule: {
      findMany: jest.fn(),
    },
    tenantModuleLicense: {
      findMany: jest.fn(),
    },
  };
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('fake-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user payload with all modules for super_admin', async () => {
      const user = {
        id: 1n,
        username: 'superadmin',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'super_admin',
        tenantId: null,
        tenant: null,
        modulePerms: [],
        userRoles: [],
      };
      mockPrisma.user.findFirst.mockResolvedValue(user);
      mockPrisma.platformModule.findMany.mockResolvedValue([
        { moduleCode: 'ehs' },
        { moduleCode: 'ai_chat' },
      ]);

      const result = await service.validateUser('superadmin', 'admin123');

      expect(result).toMatchObject({
        userId: '1',
        username: 'superadmin',
        role: 'super_admin',
        modules: expect.arrayContaining(['ehs', 'ai_chat']),
      });
      expect(mockPrisma.platformModule.findMany).toHaveBeenCalledWith({
        where: { status: 'active' },
        select: { moduleCode: true },
      });
    });

    it('should return merged modules for tenant user (licensed + direct + role)', async () => {
      const user = {
        id: 2n,
        username: 'tenantadmin',
        passwordHash: await bcrypt.hash('tenant123', 10),
        role: 'tenant_admin',
        tenantId: 1n,
        tenant: { tenantCode: 'testcorp', status: 'active' },
        modulePerms: [{ moduleCode: 'ehs' }, { moduleCode: 'unlicensed' }],
        userRoles: [
          {
            role: {
              permissions: [{ moduleCode: 'equipment' }, { moduleCode: 'ehs' }],
            },
          },
        ],
      };
      mockPrisma.user.findFirst.mockResolvedValue(user);
      mockPrisma.tenantModuleLicense.findMany.mockResolvedValue([
        { moduleCode: 'ehs' },
        { moduleCode: 'equipment' },
      ]);

      const result = await service.validateUser('tenantadmin', 'tenant123');

      expect(result.modules.sort()).toEqual(['ehs', 'equipment']);
      expect(result.modules).not.toContain('unlicensed');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.validateUser('nobody', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password mismatch', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 1n,
        username: 'superadmin',
        passwordHash: await bcrypt.hash('rightpass', 10),
        role: 'super_admin',
        tenantId: null,
        tenant: null,
        modulePerms: [],
        userRoles: [],
      });

      await expect(service.validateUser('superadmin', 'wrongpass')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('should update lastLoginAt and return access_token', async () => {
      const user = {
        id: 1n,
        username: 'superadmin',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'super_admin',
        tenantId: null,
        tenant: null,
        modulePerms: [],
        userRoles: [],
      };
      mockPrisma.user.findFirst.mockResolvedValue(user);
      mockPrisma.platformModule.findMany.mockResolvedValue([]);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.login('superadmin', 'admin123');

      expect(result.access_token).toBe('fake-jwt-token');
      expect(result.user).toMatchObject({
        username: 'superadmin',
        role: 'super_admin',
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1n },
          data: expect.objectContaining({
            lastLoginAt: expect.any(Date),
            lastLoginIp: null,
          }),
        }),
      );
    });
  });
});
