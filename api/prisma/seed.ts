import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Create platform modules
  const modules = [
    { moduleCode: 'ehs', moduleName: 'EHS安全管理', moduleCategory: '安全', description: '隐患排查、作业票管理、变更管理、安全培训', defaultPrice: 2999.0 },
    { moduleCode: 'equipment', moduleName: '设备管理', moduleCategory: '设备', description: '设备台账、检维修管理、特种设备、备品备件', defaultPrice: 1999.0 },
    { moduleCode: 'mes', moduleName: '生产执行', moduleCategory: '生产', description: '生产调度、工艺管理、批次追踪、质量检验', defaultPrice: 4999.0 },
    { moduleCode: 'ai_chat', moduleName: 'AI智能助手', moduleCategory: 'AI', description: '自然语言查询、智能问答、报表生成、数据洞察', defaultPrice: 999.0 },
    { moduleCode: 'mobile_hazard', moduleName: '语音报隐患', moduleCategory: '安全', description: '移动端语音快速上报隐患、AI自动识别与定级', defaultPrice: 599.0 },
  ];

  for (const m of modules) {
    await prisma.platformModule.upsert({
      where: { moduleCode: m.moduleCode },
      update: m,
      create: m,
    });
  }
  console.log('✅ Platform modules seeded');

  // 2. Create super admin
  const adminExists = await prisma.user.findFirst({
    where: { username: 'superadmin', role: 'super_admin' },
  });

  if (!adminExists) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        username: 'superadmin',
        passwordHash,
        realName: '系统超级管理员',
        role: 'super_admin',
        status: 'active',
      },
    });
    console.log('✅ Super admin created: superadmin / admin123');
  } else {
    console.log('⚠️ Super admin already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
