import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PlatformAdminService {
  constructor(private readonly prisma: PrismaService) {}

  // Tenants
  async listTenants(params: { status?: string; plan?: string; skip?: number; take?: number }) {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.plan) where.subscriptionPlan = params.plan;

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip: params.skip || 0,
        take: params.take || 20,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { users: true, licenses: true } },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data: data.map((t) => ({
        ...t,
        userCount: t._count.users,
        moduleCount: t._count.licenses,
        _count: undefined,
      })),
      total,
    };
  }

  async createTenant(data: {
    tenantCode: string;
    tenantName: string;
    subscriptionPlan: string;
    expireDate: string | Date;
    maxUsers: number;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    adminUsername: string;
    adminPassword: string;
    createdBy: bigint;
  }) {
    const tenant = await this.prisma.tenant.create({
      data: {
        tenantCode: data.tenantCode,
        tenantName: data.tenantName,
        subscriptionPlan: data.subscriptionPlan,
        expireDate: data.expireDate ? new Date(data.expireDate) : undefined,
        maxUsers: Number(data.maxUsers) || 10,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        createdBy: data.createdBy,
      },
    });

    const passwordHash = await bcrypt.hash(data.adminPassword, 10);
    await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        username: data.adminUsername,
        passwordHash,
        realName: '企业管理员',
        role: 'tenant_admin',
        status: 'active',
        createdBy: data.createdBy,
      },
    });

    return tenant;
  }

  async updateTenant(id: bigint, data: any) {
    const { id: _id, createdAt, updatedAt, userCount, moduleCount, _count, ...rest } = data;
    if (rest.expireDate) {
      rest.expireDate = new Date(rest.expireDate);
    }
    if (rest.maxUsers != null) {
      rest.maxUsers = Number(rest.maxUsers);
    }
    return this.prisma.tenant.update({
      where: { id },
      data: rest,
    });
  }

  async getTenantById(id: bigint) {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, username: true, realName: true, role: true, status: true } },
        licenses: { include: { module: true } },
      },
    });
  }

  // Modules
  async listModules() {
    return this.prisma.platformModule.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { licenses: true } },
      },
    });
  }

  async createModule(data: any) {
    return this.prisma.platformModule.create({ data });
  }

  async updateModule(id: bigint, data: any) {
    return this.prisma.platformModule.update({ where: { id }, data });
  }

  // Licenses
  async getTenantLicenses(tenantId: bigint) {
    return this.prisma.tenantModuleLicense.findMany({
      where: { tenantId },
      include: { module: true },
    });
  }

  async upsertLicense(data: {
    tenantId: bigint;
    moduleCode: string;
    status: string;
    expireDate?: Date;
    maxUsers?: number;
    customPrice?: number;
  }) {
    return this.prisma.tenantModuleLicense.upsert({
      where: {
        tenantId_moduleCode: {
          tenantId: data.tenantId,
          moduleCode: data.moduleCode,
        },
      },
      update: {
        status: data.status,
        expireDate: data.expireDate,
        maxUsers: data.maxUsers,
        customPrice: data.customPrice,
      },
      create: {
        tenantId: data.tenantId,
        moduleCode: data.moduleCode,
        status: data.status,
        expireDate: data.expireDate,
        maxUsers: data.maxUsers,
        customPrice: data.customPrice,
      },
    });
  }
}
