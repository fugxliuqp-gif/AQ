import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../src/prisma/prisma.service';

export function getJwtToken(app: INestApplication, payload: Record<string, any>): string {
  const jwt = app.get(JwtService);
  return jwt.sign(payload);
}

export async function cleanDatabase(prisma: PrismaService) {
  // 保留 platform_modules（seed 基础数据），清理所有业务数据
  const tables = [
    'user_roles',
    'role_permissions',
    'user_module_permissions',
    'user_data_scopes',
    'roles',
    'users',
    'tenant_module_licenses',
    'tenants',
  ];
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    } catch (e) {
      // ignore if table doesn't exist during partial runs
    }
  }
}

export async function seedPlatformModules(prisma: PrismaService) {
  const modules = [
    { moduleCode: 'ehs', moduleName: 'EHS安全管理', moduleCategory: '安全', description: '隐患排查', defaultPrice: 2999 },
    { moduleCode: 'equipment', moduleName: '设备管理', moduleCategory: '设备', description: '设备台账', defaultPrice: 1999 },
    { moduleCode: 'ai_chat', moduleName: 'AI智能助手', moduleCategory: 'AI', description: '智能问答', defaultPrice: 999 },
  ];
  for (const m of modules) {
    await prisma.platformModule.upsert({
      where: { moduleCode: m.moduleCode },
      update: {},
      create: m as any,
    });
  }
}
