# NestJS 后台测试计划 (Week 1 闭环验证)

> **适用阶段**：Admin Dashboard 前后端 API 集成完成，RBAC + SaaS 多租户架构初步落地。  
> **目标**：通过分层测试（单元/集成/E2E）确保平台管理员、租户管理员、角色权限、模块授权等核心链路稳定可靠。

---

## 1. 架构与接口全景

### 1.1 核心架构组件

| 层级 | 文件 | 职责 |
|------|------|------|
| **认证层** | `auth.controller.ts` / `auth.service.ts` / `jwt.strategy.ts` | JWT 签发与校验、登录、密码比对、模块权限聚合 |
| **全局守卫** | `jwt-auth.guard.ts` / `roles.guard.ts` | `@Public()` 放行、`@Roles()` 角色校验、401/403 处理 |
| **租户中间件** | `tenant.middleware.ts` | 自动挂载 `tenantId`、租户状态/过期检查、`super_admin` 豁免 |
| **序列化拦截器** | `bigint.interceptor.ts` | 递归将 Prisma `BigInt` 转为 `string`，避免 `JSON.stringify` 崩溃 |
| **平台管理** | `platform-admin/*` | 租户生命周期、平台模块目录、模块授权许可 |
| **租户管理** | `tenant/*` | 角色 CRUD、用户 CRUD、租户可用模块查询 |
| **数据层** | `prisma.service.ts` | Prisma Client 单例、数据库连接 |

### 1.2 接口路由矩阵

```
POST   /auth/login                           → 登录，返回 JWT

GET    /admin/platform/tenants               → 分页查询租户列表
POST   /admin/platform/tenants               → 创建租户 + 默认管理员
GET    /admin/platform/tenants/:id           → 租户详情
PUT    /admin/platform/tenants/:id           → 更新租户

GET    /admin/platform/modules               → 平台模块列表
POST   /admin/platform/modules               → 创建模块
PUT    /admin/platform/modules/:id           → 更新模块

GET    /admin/platform/licenses/:tenantId    → 租户模块授权列表
POST   /admin/platform/licenses/:tenantId    → 授予/更新模块许可

GET    /admin/tenant/info                    → 当前租户信息
GET    /admin/tenant/modules                 → 当前租户可用模块
GET    /admin/tenant/roles                   → 角色列表
POST   /admin/tenant/roles                   → 创建角色
PUT    /admin/tenant/roles/:id               → 更新角色
DELETE /admin/tenant/roles/:id               → 删除角色
GET    /admin/tenant/users                   → 用户列表
POST   /admin/tenant/users                   → 创建用户
PUT    /admin/tenant/users/:id               → 更新用户
```

---

## 2. 测试策略与分层

采用 **金字塔模型**：单元测试（底层逻辑）+ 集成测试（Controller/Service 与 Prisma 交互）+ E2E 测试（完整请求链路）。

```
        /\
       /  \   E2E (端到端)  → 覆盖核心业务流程
      /____\     占比 ~15%
     /      \   Integration (控制器/服务层)  → 覆盖权限、业务规则、异常
    /________\   占比 ~35%
   /          \  Unit (纯函数/独立逻辑)  → Guard、Interceptor、工具函数
  /____________\  占比 ~50%
```

### 2.1 测试环境约定

- **单元测试**：Prisma Client 全部 Mock，不连数据库。
- **集成测试**：使用 **SQLite 内存模式** 或 **独立 PostgreSQL Schema**（推荐 Docker `postgres:16-alpine` + `TEST_DATABASE_URL`），每测完清理数据。
- **E2E 测试**：启动完整 NestJS 应用（`AppModule`），HTTP 真实请求，数据库独立 Schema。

---

## 3. 测试覆盖矩阵

### 3.1 认证与授权层 (Auth & Guards)

| 测试对象 | 类型 | 关键场景 | 优先级 |
|---------|------|---------|--------|
| `AuthService.validateUser` | Unit/Integration | ① 正确用户名密码返回用户+模块；② 密码错误抛 `UnauthorizedException`；③ 用户不存在抛异常；④ `super_admin` 聚合全部模块；⑤ 租户用户聚合 licensed + 直接权限 + 角色权限 | P0 |
| `AuthService.login` | Unit/Integration | ① 更新 `lastLoginAt`；② 返回 `access_token` + user | P0 |
| `AuthController.login` | Integration | ① DTO 校验拒绝空 username/password；② 正常返回 200；③ 密码错误 401 | P0 |
| `JwtAuthGuard` | Unit | ① `@Public()` 路由放行；② 无 Token 401；③ 过期 Token 401 | P0 |
| `RolesGuard` | Unit | ① 无 `@Roles()` 放行；② 角色匹配放行；③ 角色不匹配 403 | P0 |
| `TenantMiddleware` | Unit/Integration | ① `super_admin` 设置 `ignoreTenantFilter`；② 无 `tenantId` 401；③ 租户不存在 401；④ 租户过期自动更新状态并 403；⑤ 正常挂载 `tenantId` | P0 |
| `BigIntInterceptor` | Unit | ① 普通对象递归转 string；② 嵌套数组/对象处理；③ `null/undefined` 不报错 | P1 |
| `JwtStrategy.validate` | Unit | 直接返回 payload | P1 |

### 3.2 平台管理员接口 (Platform Admin)

| 测试对象 | 类型 | 关键场景 | 优先级 |
|---------|------|---------|--------|
| `PlatformAdminService.listTenants` | Integration | ① 无过滤分页；② `status` + `plan` 联合过滤；③ 返回 `userCount` / `moduleCount` | P1 |
| `PlatformAdminService.createTenant` | Integration | ① 创建租户成功；② 同时创建默认 `tenant_admin` 用户；③ `tenantCode` 唯一冲突抛 `P2002` | P0 |
| `PlatformAdminService.updateTenant` | Integration | ① 正常更新；② 过滤前端非法字段 (`id`, `createdAt`, `userCount` 等)；③ `expireDate` / `maxUsers` 类型转换 | P1 |
| `PlatformAdminService.getTenantById` | Integration | ① 返回租户 + users + licenses | P1 |
| `PlatformAdminService.upsertLicense` | Integration | ① 首次创建许可；② 更新状态/过期时间；③ 返回 `tenantId` + `moduleCode` | P0 |
| `PlatformAdminTenantsController` | Integration | ① `@Roles('super_admin')` 生效；② `tenant_admin` 访问 403；③ `skip/take` 解析 | P0 |
| `PlatformAdminLicensesController` | Integration | ① `ParseIntPipe` 拒绝非法 `tenantId`；② body 校验 | P1 |

### 3.3 租户管理员接口 (Tenant Admin)

| 测试对象 | 类型 | 关键场景 | 优先级 |
|---------|------|---------|--------|
| `TenantAdminService.getTenantInfo` | Integration | ① 返回当前租户信息 + active licenses + 统计 | P1 |
| `TenantAdminService.listRoles` | Integration | ① 仅返回当前 `tenantId` 的角色；② 包含 permissions + `_count.userRoles` | P1 |
| `TenantAdminService.createRole` | Integration | ① 正常创建角色+权限；② `moduleCodes` 超出租户许可抛 `BadRequestException`；③ 空 `moduleCodes` 正常 | P0 |
| `TenantAdminService.updateRole` | Integration | ① 更新角色并替换权限；② 非法 `moduleCode` 拦截；③ 不存在的角色 400 | P0 |
| `TenantAdminService.deleteRole` | Integration | ① 正常删除并级联清权限/用户关联；② `isDefault=true` 禁止删除 403；③ 不存在的角色 400 | P0 |
| `TenantAdminService.listUsers` | Integration | ① 分页；② 包含 `userRoles.role` 嵌套 | P1 |
| `TenantAdminService.createUser` | Integration | ① 正常创建并分配 roleIds；② 超过 `maxUsers` 配额 403；③ 默认 `role='tenant_user'`；④ `modulePerms` / `dataScopes` 写入 | P0 |
| `TenantAdminService.updateUser` | Integration | ① 更新并全量替换 role/module/scope；② 不存在用户 400 | P0 |
| `TenantAdminService.getUserModules` | Integration | ① 仅返回 active + 未过期 的 licensed modules | P1 |
| `TenantAdminController` | Integration | ① `CurrentUser` 装饰器注入正常；② 所有路由只能由 `tenant_admin` 访问；③ `ParseIntPipe` 校验 | P0 |

### 3.4 端到端核心业务流程 (E2E)

| 场景编号 | 流程 | 验证点 | 优先级 |
|---------|------|--------|--------|
| E2E-01 | **Super Admin 全生命周期** | 登录 → 创建租户 → 查看租户详情 → 分配模块许可 → 更新租户 → 列表查询 | P0 |
| E2E-02 | **Tenant Admin 登录与信息** | 用默认管理员登录 → 获取租户信息 → 获取可用模块列表（应含已授权模块） | P0 |
| E2E-03 | **角色-用户-权限闭环** | 租户登录 → 创建角色（绑定 ehs + ai_chat）→ 创建用户并分配角色 → 新用户登录 → JWT `modules` 必须含 `ehs, ai_chat` | P0 |
| E2E-04 | **越权与异常防御** | ① 无 Token 访问平台接口 401；② `tenant_admin` 访问平台接口 403；③ `super_admin` 访问租户接口 403；④ 创建超过 `maxUsers` 的用户 403；⑤ 给角色分配未授权模块 400 | P0 |
| E2E-05 | **租户过期自动拦截** | 平台更新租户 `expireDate` 为过去时间 → 租户管理员任意接口请求 → 应返回 403 并自动更新租户状态为 `expired` | P1 |

---

## 4. 测试数据规范（Fixture）

建议在 `test/fixtures/` 或 `prisma/seed-test.ts` 中维护以下基础数据：

```typescript
// 1. 平台超级管理员
{ username: 'superadmin', password: 'admin123', role: 'super_admin', status: 'active' }

// 2. 租户与默认管理员（createTenant 自动生成）
{ tenantCode: 'testcorp', tenantName: '测试企业', subscriptionPlan: 'professional', maxUsers: 5 }
{ username: 'tenantadmin', password: 'tenant123', role: 'tenant_admin', tenantId: 1 }

// 3. 平台模块（seed 已存在）
['ehs', 'equipment', 'mes', 'ai_chat', 'mobile_hazard']

// 4. 测试用自定义角色
{ roleName: '安全管理员', moduleCodes: ['ehs'] }

// 5. 测试用普通用户
{ username: 'testuser', password: 'user123', role: 'tenant_user', tenantId: 1 }
```

---

## 5. 环境配置与执行命令

### 5.1 新增依赖（如未安装）

```bash
npm i -D @nestjs/testing jest ts-jest supertest @types/supertest
```

### 5.2 测试专用环境变量（`.env.test`）

```env
# 使用独立测试数据库，避免污染开发数据
DATABASE_URL="postgresql://postgres:postgres123@localhost:5433/safety_saas_test"
JWT_SECRET="test-secret-key"
JWT_EXPIRES_IN="1h"
```

> **注意**：E2E / Integration 测试前，通过 `npx prisma migrate deploy --preview-feature` 或 `prisma db push` 初始化测试库结构。

### 5.3 执行命令

```bash
# 单元测试（快速，无数据库）
npm run test

# 覆盖率报告
npm run test:cov

# E2E 测试（完整 HTTP 链路）
npm run test:e2e

# 仅执行特定文件
npx jest src/auth/auth.service.spec.ts
```

---

## 6. 关键测试实现建议

### 6.1 Prisma Mock 单元测试模板

```typescript
const mockPrisma = {
  user: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  tenant: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn() },
  role: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  // ...
};

beforeEach(() => {
  jest.clearAllMocks();
});
```

### 6.2 E2E 测试：JWT 生成辅助函数

```typescript
import { JwtService } from '@nestjs/jwt';

function getToken(app, payload) {
  const jwt = app.get(JwtService);
  return jwt.sign(payload);
}

// 使用示例
const superToken = getToken(app, { userId: '1', username: 'superadmin', role: 'super_admin', modules: [] });
await request(app.getHttpServer())
  .get('/admin/platform/tenants')
  .set('Authorization', `Bearer ${superToken}`)
  .expect(200);
```

### 6.3 E2E 测试：数据库事务回滚/清理

推荐方案：**每个 `it` 块前清空相关表**，避免测试间污染：

```typescript
beforeEach(async () => {
  const prisma = app.get(PrismaService);
  await prisma.$transaction([
    prisma.userRole.deleteMany(),
    prisma.rolePermission.deleteMany(),
    prisma.role.deleteMany(),
    prisma.user.deleteMany({ where: { username: { not: 'superadmin' } } }),
    prisma.tenantModuleLicense.deleteMany(),
    prisma.tenant.deleteMany(),
  ]);
});
```

---

## 7. 风险与排期建议

| 风险点 | 影响 | 缓解措施 |
|--------|------|----------|
| `BigInt` 全局拦截器若遗漏边缘类型（如 `Date`、`Decimal`） | 前端解析异常 | Interceptor 增加对 `Date` 的 `toISOString()` 处理；补充边界测试 |
| `tenant.middleware.ts` 里 `new Date()` 与数据库时区不一致 | 过期判断偏差 | 测试时使用明确时区的 `Date`；增加跨天临界测试 |
| Prisma `upsert` / 级联删除 在并发测试下偶发锁 | 测试不稳定 | 使用 `jest --runInBand` 串行执行 E2E；Integration 层尽量 Mock |
| `ValidationPipe(whitelist: true)` 吞掉未知字段导致调试困难 | 开发效率低 | DTO 显式声明 + 测试覆盖非法字段拒绝场景 |
| 缺少模块操作粒度（目前只有 `read`, `execute`） | 后续细粒度 RBAC 扩展困难 | 在测试计划中预留 actions 动态校验 case |

### 建议排期

| 阶段 | 内容 | 预估工时 |
|------|------|---------|
| **第 1 天** | 补齐单元测试：`AuthService`, `Guards`, `Interceptor`, `TenantMiddleware` | 4h |
| **第 2 天** | Integration 测试：`PlatformAdminService` + `TenantAdminService`（Mock Prisma） | 6h |
| **第 3 天** | Integration 测试：全部 Controllers（ Guards + Pipes 验证） | 4h |
| **第 4 天** | E2E 测试：5 条核心链路 + 测试数据 Fixture 固化 | 6h |
| **第 5 天** | CI 集成（GitHub Actions / GitLab CI）+ 覆盖率门禁（≥60%） | 4h |

---

## 8. 验收标准 (Definition of Done)

- [ ] `npm run test:cov` 总体行覆盖率 **≥ 60%**，核心 Service (`auth`, `platform-admin`, `tenant-admin`) **≥ 75%**。  
- [ ] E2E-01 ~ E2E-04 全部通过。  
- [ ] 所有 P0 级异常场景（401/403/400/P2002）均有对应测试断言。  
- [ ] CI 流水线中 `test` 和 `test:e2e` 步骤零失败。  
- [ ] 测试数据库与开发数据库完全隔离，互不影响。  

---

## 附录：当前测试资产清单

| 文件 | 状态 | 备注 |
|------|------|------|
| `src/app.controller.spec.ts` | ✅ 通过 | `AppController.getHello()` 样例测试 |
| `src/auth/auth.service.spec.ts` | ✅ 通过 | 覆盖：登录成功、密码错误、用户不存在、super_admin 模块聚合、tenant 用户权限合并、lastLoginAt 更新 |
| `src/tenant/tenant-admin.service.spec.ts` | ✅ 通过 | 覆盖：角色创建/更新/删除、未授权模块拦截、默认角色保护、用户创建（含配额超限）、默认 role、关系全量替换 |
| `test/app.e2e-spec.ts` | ✅ 通过 | 根路径健康检查（`@Public()`） |
| `test/platform-admin.e2e-spec.ts` | ✅ 通过 | 覆盖：Super Admin 租户全生命周期（创建→详情→授权→更新→列表）、越权访问 403、未认证 401 |
| `test/tenant-admin.e2e-spec.ts` | ✅ 通过 | 覆盖：租户信息/可用模块、角色创建（含非法模块 400）、用户配额 403、**角色-用户-权限闭环**（登录验证 JWT modules 动态变化） |
| `test/test-utils.ts` | ✅ 新增 | `getJwtToken`、`cleanDatabase`、`seedPlatformModules` |
| `test/jest-e2e.json` | ✅ 存在 | 基础 NestJS E2E Jest 配置 |
| `.env.test` | ✅ 新增 | 指向独立测试库 `chemical_saas_test` |

### 执行结果快照

```bash
# 单元测试
npx jest --runInBand --no-coverage
# Test Suites: 12 passed, 12 total
# Tests:       65 passed, 65 total

# E2E 测试
npx jest --config ./test/jest-e2e.json --runInBand --no-coverage
# Test Suites: 3 passed, 3 total
# Tests:       8 passed, 8 total
```

### 覆盖率报告（`npx jest --coverage`）

| 目录/模块 | 语句 (Stmts) | 分支 (Branch) | 函数 (Funcs) | 行 (Lines) |
|-----------|-------------|---------------|-------------|-----------|
| **All files** | **81.46%** | **76.34%** | **85.88%** | **82.18%** |
| `src/auth` | 85.93% | 70% | 100% | 87.03% |
| `src/platform-admin` | 84.81% | 71.05% | 82.6% | 85.07% |
| `src/tenant` | 82.65% | 68.96% | 83.87% | 86.74% |
| `src/common/guards` | 100% | 90.9% | 100% | 100% |
| `src/common/interceptors` | 100% | 100% | 100% | 100% |
| `src/common/middleware` | 100% | 95% | 100% | 100% |

> 注：`*.module.ts` / `main.ts` 等纯配置/入口文件通常不计入有效覆盖率，它们拉低了 `src/` 根目录统计，属于正常情况。
