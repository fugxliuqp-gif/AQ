import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { username, status: 'active' },
      include: {
        tenant: true,
        modulePerms: { where: { status: 'granted' } },
        userRoles: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // Collect modules from both direct user permissions and role-based permissions
    const moduleSet = new Set<string>();

    if (user.role === 'super_admin') {
      const allModules = await this.prisma.platformModule.findMany({
        where: { status: 'active' },
        select: { moduleCode: true },
      });
      allModules.forEach((m) => moduleSet.add(m.moduleCode));
    } else if (user.tenantId) {
      // Check tenant module licenses
      const licenses = await this.prisma.tenantModuleLicense.findMany({
        where: {
          tenantId: user.tenantId,
          status: 'active',
          OR: [
            { expireDate: null },
            { expireDate: { gte: new Date() } },
          ],
        },
        select: { moduleCode: true },
      });
      const licensedModules = new Set(licenses.map((l) => l.moduleCode));

      // Direct user permissions
      user.modulePerms.forEach((p) => {
        if (licensedModules.has(p.moduleCode)) {
          moduleSet.add(p.moduleCode);
        }
      });

      // Role-based permissions
      user.userRoles.forEach((ur) => {
        ur.role.permissions.forEach((rp) => {
          if (licensedModules.has(rp.moduleCode)) {
            moduleSet.add(rp.moduleCode);
          }
        });
      });
    }

    return {
      userId: user.id.toString(),
      username: user.username,
      role: user.role,
      tenantId: user.tenantId?.toString(),
      tenantCode: user.tenant?.tenantCode,
      tenantStatus: user.tenant?.status,
      modules: Array.from(moduleSet),
    };
  }

  async login(username: string, password: string) {
    const payload = await this.validateUser(username, password);

    await this.prisma.user.update({
      where: { id: BigInt(payload.userId) },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: null,
      },
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: payload,
    };
  }
}
