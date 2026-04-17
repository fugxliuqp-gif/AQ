import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantInfo(tenantId: bigint) {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        licenses: {
          where: { status: 'active' },
          include: { module: true },
        },
        _count: { select: { users: true, roles: true } },
      },
    });
  }

  // --- Role Management ---
  async listRoles(tenantId: bigint) {
    return this.prisma.role.findMany({
      where: { tenantId, status: 'active' },
      include: {
        permissions: { include: { module: true } },
        _count: { select: { userRoles: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRole(
    tenantId: bigint,
    data: {
      roleName: string;
      description?: string;
      moduleCodes?: string[];
    },
    createdBy: bigint,
  ) {
    // Validate module codes against tenant licenses
    if (data.moduleCodes && data.moduleCodes.length > 0) {
      const licenses = await this.prisma.tenantModuleLicense.findMany({
        where: {
          tenantId,
          status: 'active',
          OR: [{ expireDate: null }, { expireDate: { gte: new Date() } }],
          moduleCode: { in: data.moduleCodes },
        },
      });
      const licensedCodes = new Set(licenses.map((l) => l.moduleCode));
      const invalid = data.moduleCodes.filter((c) => !licensedCodes.has(c));
      if (invalid.length > 0) {
        throw new BadRequestException(`以下模块未对企业开通：${invalid.join(', ')}`);
      }
    }

    return this.prisma.role.create({
      data: {
        tenantId,
        roleName: data.roleName,
        description: data.description,
        createdBy,
        permissions: {
          create:
            data.moduleCodes?.map((code) => ({
              moduleCode: code,
              actions: ['read', 'execute'],
            })) || [],
        },
      },
      include: { permissions: { include: { module: true } } },
    });
  }

  async updateRole(
    tenantId: bigint,
    roleId: bigint,
    data: {
      roleName?: string;
      description?: string;
      moduleCodes?: string[];
      status?: string;
    },
  ) {
    const existing = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });
    if (!existing) throw new BadRequestException('角色不存在');

    // Validate module codes
    if (data.moduleCodes && data.moduleCodes.length > 0) {
      const licenses = await this.prisma.tenantModuleLicense.findMany({
        where: {
          tenantId,
          status: 'active',
          OR: [{ expireDate: null }, { expireDate: { gte: new Date() } }],
          moduleCode: { in: data.moduleCodes },
        },
      });
      const licensedCodes = new Set(licenses.map((l) => l.moduleCode));
      const invalid = data.moduleCodes.filter((c) => !licensedCodes.has(c));
      if (invalid.length > 0) {
        throw new BadRequestException(`以下模块未对企业开通：${invalid.join(', ')}`);
      }
    }

    // Replace permissions
    await this.prisma.rolePermission.deleteMany({ where: { roleId } });

    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        roleName: data.roleName,
        description: data.description,
        status: data.status,
        permissions: {
          create:
            data.moduleCodes?.map((code) => ({
              moduleCode: code,
              actions: ['read', 'execute'],
            })) || [],
        },
      },
      include: { permissions: { include: { module: true } } },
    });
  }

  async deleteRole(tenantId: bigint, roleId: bigint) {
    const existing = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });
    if (!existing) throw new BadRequestException('角色不存在');
    if (existing.isDefault) {
      throw new ForbiddenException('系统默认角色不可删除');
    }

    await this.prisma.userRole.deleteMany({ where: { roleId } });
    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    await this.prisma.role.delete({ where: { id: roleId } });
    return { success: true };
  }

  // --- User Management ---
  async listUsers(tenantId: bigint, params: { skip?: number; take?: number }) {
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { tenantId },
        skip: params.skip || 0,
        take: params.take || 20,
        orderBy: { createdAt: 'desc' },
        include: {
          modulePerms: true,
          dataScopes: true,
          userRoles: { include: { role: true } },
        },
      }),
      this.prisma.user.count({ where: { tenantId } }),
    ]);
    return { data, total };
  }

  async createUser(
    tenantId: bigint,
    data: {
      username: string;
      password: string;
      realName?: string;
      phone?: string;
      email?: string;
      role?: string;
      roleIds?: number[];
      moduleCodes?: string[];
      dataScopes?: { scopeType: string; scopeId: bigint; scopeName?: string }[];
    },
    createdBy: bigint,
  ) {
    // Check user quota
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { _count: { select: { users: true } } },
    });
    if (!tenant) throw new BadRequestException('租户不存在');
    if (tenant._count.users >= tenant.maxUsers) {
      throw new ForbiddenException('已达到用户数量上限，请联系平台升级套餐');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        tenantId,
        username: data.username,
        passwordHash,
        realName: data.realName,
        phone: data.phone,
        email: data.email,
        role: data.role || 'tenant_user',
        status: 'active',
        createdBy,
        modulePerms: {
          create:
            data.moduleCodes?.map((code) => ({
              moduleCode: code,
              status: 'granted',
              grantedBy: createdBy,
            })) || [],
        },
        dataScopes: {
          create: data.dataScopes || [],
        },
        userRoles: {
          create:
            data.roleIds?.map((rid) => ({
              roleId: BigInt(rid),
              assignedBy: createdBy,
            })) || [],
        },
      },
    });

    return user;
  }

  async updateUser(
    tenantId: bigint,
    userId: bigint,
    data: {
      realName?: string;
      phone?: string;
      email?: string;
      role?: string;
      status?: string;
      roleIds?: number[];
      moduleCodes?: string[];
      dataScopes?: { scopeType: string; scopeId: bigint; scopeName?: string }[];
    },
    updatedBy: bigint,
  ) {
    const existing = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!existing) throw new BadRequestException('用户不存在');

    await this.prisma.userModulePermission.deleteMany({
      where: { userId },
    });
    await this.prisma.userDataScope.deleteMany({
      where: { userId },
    });
    await this.prisma.userRole.deleteMany({
      where: { userId },
    });

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        realName: data.realName,
        phone: data.phone,
        email: data.email,
        role: data.role,
        status: data.status,
        modulePerms: {
          create:
            data.moduleCodes?.map((code) => ({
              moduleCode: code,
              status: 'granted',
              grantedBy: updatedBy,
            })) || [],
        },
        dataScopes: {
          create: data.dataScopes || [],
        },
        userRoles: {
          create:
            data.roleIds?.map((rid) => ({
              roleId: BigInt(rid),
              assignedBy: updatedBy,
            })) || [],
        },
      },
    });
  }

  async getUserModules(tenantId: bigint) {
    const licenses = await this.prisma.tenantModuleLicense.findMany({
      where: {
        tenantId,
        status: 'active',
        OR: [{ expireDate: null }, { expireDate: { gte: new Date() } }],
      },
      include: { module: true },
    });
    return licenses.map((l) => l.module);
  }
}
