import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

export interface RequestWithTenant extends Request {
  tenantId?: bigint;
  tenantCode?: string;
  ignoreTenantFilter?: boolean;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: RequestWithTenant, res: Response, next: NextFunction) {
    const user = (req as any).user;
    if (!user) {
      return next();
    }

    // Platform super admin has no tenant
    if (user.role === 'super_admin') {
      req.ignoreTenantFilter = true;
      return next();
    }

    const tenantId = user.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException('无效租户信息');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: BigInt(tenantId) },
    });

    if (!tenant) {
      throw new UnauthorizedException('租户不存在');
    }

    if (tenant.status === 'expired' || tenant.status === 'suspended') {
      throw new ForbiddenException('租户服务已过期或被停用');
    }

    if (tenant.expireDate && new Date(tenant.expireDate) < new Date()) {
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { status: 'expired' },
      });
      throw new ForbiddenException('租户服务已过期');
    }

    req.tenantId = tenant.id;
    req.tenantCode = tenant.tenantCode;
    next();
  }
}
