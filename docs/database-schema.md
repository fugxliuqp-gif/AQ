# 数据库模型设计：SaaS 多租户平台

## 1. ER 关系图（文字描述）

```
┌─────────────────┐       ┌─────────────────────────┐       ┌─────────────────┐
│  tenants        │◄──────┤ tenant_module_licenses  ├──────►│ platform_modules│
│  (租户)         │  1:N  │  (租户模块授权)          │  N:1  │  (平台模块)      │
└────────┬────────┘       └─────────────────────────┘       └─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐       ┌─────────────────────────┐
│  users          │◄──────┤ user_module_permissions │
│  (用户)         │  1:N  │  (用户模块权限)          │
└────────┬────────┘       └─────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐       ┌─────────────────┐
│ user_data_scopes│       │  login_logs     │
│  (数据范围)      │       │  (登录审计)      │
└─────────────────┘       └─────────────────┘
```

---

## 2. 表结构详述

### 2.1 tenants（租户表）
存储平台服务的所有企业/组织信息。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | BIGSERIAL | PK | 租户自增ID |
| `tenant_code` | VARCHAR(64) | UQ, NOT NULL | 租户唯一编码，用于子域和API路由 |
| `tenant_name` | VARCHAR(128) | NOT NULL | 企业显示名称 |
| `tenant_type` | VARCHAR(32) | | 企业类型：production/trade/storage |
| `status` | VARCHAR(16) | DEFAULT 'active' | active/inactive/expired/suspended |
| `subscription_plan` | VARCHAR(32) | | 订阅套餐：basic/pro/enterprise |
| `start_date` | DATE | | 服务生效日期 |
| `expire_date` | DATE | | **服务到期日期（核心控制字段）** |
| `max_users` | INT | DEFAULT 10 | 该租户最大用户配额 |
| `max_storage_gb` | INT | DEFAULT 50 | 最大存储配额(GB) |
| `contact_name` | VARCHAR(64) | | 企业联系人 |
| `contact_phone` | VARCHAR(32) | | 联系人电话 |
| `contact_email` | VARCHAR(128) | | 联系人邮箱 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |
| `created_by` | BIGINT | FK -> users(id) | 创建该租户的超管ID |

**索引**：
```sql
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_expire_date ON tenants(expire_date);
```

---

### 2.2 platform_modules（平台功能模块表）
定义平台可售卖和分配的功能模块。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | BIGSERIAL | PK | 自增ID |
| `module_code` | VARCHAR(64) | UQ, NOT NULL | 模块编码：ehs/equipment/mes/ai_chat/mobile_hazard |
| `module_name` | VARCHAR(128) | NOT NULL | 模块显示名称 |
| `module_category` | VARCHAR(64) | | 分类：safety/equipment/production/ai/utility |
| `description` | TEXT | | 模块描述 |
| `icon` | VARCHAR(128) | | 图标类名或URL |
| `default_price` | DECIMAL(10,2) | | 默认单价（元/月） |
| `depends_on` | VARCHAR(64)[] | DEFAULT '{}' | 依赖的模块编码数组 |
| `status` | VARCHAR(16) | DEFAULT 'active' | active/deprecated |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**初始数据示例**：
```sql
INSERT INTO platform_modules (module_code, module_name, module_category, description) VALUES
('ehs', 'EHS安全管理', 'safety', '隐患排查、作业票、变更管理等'),
('equipment', '设备管理', 'equipment', '设备台账、检维修、特种设备'),
('mes', '生产执行', 'production', '生产调度、工艺管理'),
('ai_chat', 'AI智能助手', 'ai', '自然语言查询和对话'),
('mobile_hazard', '语音报隐患', 'safety', '移动端语音快速上报隐患');
```

---

### 2.3 tenant_module_licenses（租户模块授权表）
记录每个租户被授权使用的模块及有效期。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | BIGSERIAL | PK | 自增ID |
| `tenant_id` | BIGINT | FK, NOT NULL | 租户ID |
| `module_code` | VARCHAR(64) | FK, NOT NULL | 模块编码 |
| `status` | VARCHAR(16) | DEFAULT 'active' | active/inactive/pending |
| `start_date` | DATE | | 模块授权开始日期 |
| `expire_date` | DATE | | **模块到期日期** |
| `max_users` | INT | | 该模块可分配给的用户上限 |
| `custom_price` | DECIMAL(10,2) | | 实际成交价格 |
| `config_json` | JSONB | DEFAULT '{}' | 模块级配置，如AI每日调用次数限制 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**约束**：
```sql
UNIQUE(tenant_id, module_code)
```

**索引**：
```sql
CREATE INDEX idx_tml_tenant ON tenant_module_licenses(tenant_id);
CREATE INDEX idx_tml_expire ON tenant_module_licenses(expire_date);
```

---

### 2.4 users（用户表）
统一存储平台超管、企业管理员和普通用户。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | BIGSERIAL | PK | 自增ID |
| `tenant_id` | BIGINT | FK, nullable | 所属租户ID。平台超管为 NULL |
| `username` | VARCHAR(64) | NOT NULL | 用户名/工号 |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt 哈希值 |
| `real_name` | VARCHAR(64) | | 真实姓名 |
| `phone` | VARCHAR(32) | | 手机号 |
| `email` | VARCHAR(128) | | 邮箱 |
| `avatar_url` | VARCHAR(255) | | 头像URL |
| `role` | VARCHAR(32) | NOT NULL | super_admin/tenant_admin/tenant_user/auditor |
| `status` | VARCHAR(16) | DEFAULT 'active' | active/inactive/locked |
| `last_login_at` | TIMESTAMPTZ | | 最后登录时间 |
| `last_login_ip` | INET | | 最后登录IP |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `created_by` | BIGINT | FK -> users(id) | 创建人ID |

**约束**：
```sql
-- 租户内用户名唯一，平台级用户(tenant_id IS NULL)全局唯一
UNIQUE(tenant_id, username)
```

**索引**：
```sql
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

---

### 2.5 user_module_permissions（用户模块权限表）
精细化控制：租户内某个用户能否使用某个已授权模块。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | BIGSERIAL | PK | |
| `user_id` | BIGINT | FK, NOT NULL | 用户ID |
| `module_code` | VARCHAR(64) | NOT NULL | 模块编码 |
| `status` | VARCHAR(16) | DEFAULT 'granted' | granted/revoked |
| `granted_by` | BIGINT | FK -> users(id) | 分配人 |
| `granted_at` | TIMESTAMPTZ | DEFAULT NOW() | 分配时间 |

**约束**：
```sql
UNIQUE(user_id, module_code)
```

---

### 2.6 user_data_scopes（用户数据范围表）
ABAC 数据权限：控制用户能看到哪些车间/部门的数据。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | BIGSERIAL | PK | |
| `user_id` | BIGINT | FK, NOT NULL | 用户ID |
| `scope_type` | VARCHAR(32) | NOT NULL | dept/workshop/project |
| `scope_id` | BIGINT | NOT NULL | 对应范围的ID |
| `scope_name` | VARCHAR(64) | | 冗余名称，方便展示 |

**索引**：
```sql
CREATE INDEX idx_uds_user ON user_data_scopes(user_id);
```

---

### 2.7 login_logs（登录审计表）
记录所有登录行为，满足安全和审计要求。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | BIGSERIAL | PK | |
| `user_id` | BIGINT | | 用户ID |
| `tenant_id` | BIGINT | | 租户ID |
| `username` | VARCHAR(64) | | 用户名 |
| `login_type` | VARCHAR(16) | | password/sso/otp |
| `ip_address` | INET | | IP地址 |
| `user_agent` | TEXT | | UA字符串 |
| `status` | VARCHAR(16) | | success/failed |
| `fail_reason` | VARCHAR(128) | | 失败原因 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**分区建议**：按 `created_at` 按月分区，便于历史数据归档。

---

### 2.8 operation_logs（操作审计表）
记录超管和租户管理员的关键操作。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | BIGSERIAL | PK | |
| `user_id` | BIGINT | | 操作人 |
| `tenant_id` | BIGINT | | 目标租户（跨租户操作时） |
| `action` | VARCHAR(64) | NOT NULL | 操作类型：create_tenant/assign_module/create_user |
| `resource_type` | VARCHAR(64) | | 资源类型：tenant/module/user |
| `resource_id` | BIGINT | | 资源ID |
| `before_data` | JSONB | | 变更前数据快照 |
| `after_data` | JSONB | | 变更后数据快照 |
| `ip_address` | INET | | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

## 3. 数据隔离原则

### 3.1 强制规则
1. **所有业务表必须包含 `tenant_id`**，且为 `NOT NULL`
2. **查询必须带 `tenant_id` 过滤**，通过 ORM 拦截器自动注入
3. **超管跨租户查询**需显式打开 `ignore_tenant_filter` 标记
4. **报表统计**使用 `tenant_id` 分组，禁止跨租户聚合敏感数据

### 3.2 ORM 拦截示例（Prisma）
```typescript
// middleware.ts
prisma.$use(async (params, next) => {
  const tenantId = getCurrentTenantId();
  
  if (params.model && !isSuperAdminOperation(params)) {
    if (params.action === 'findUnique') {
      params.args.where = { ...params.args.where, tenant_id: tenantId };
    }
    if (params.action === 'findMany') {
      params.args.where = { ...params.args.where, tenant_id: tenantId };
    }
    if (params.action === 'create') {
      params.args.data = { ...params.args.data, tenant_id: tenantId };
    }
    // update/delete 同理...
  }
  
  return next(params);
});
```

---

## 4. 权限校验流程

```
用户请求 /api/equipment/list
   │
   ▼
1. JWT 解码 → 获取 user_id, tenant_id, role, modules[]
   │
   ▼
2. 校验租户状态
   ├─ tenant.status = 'active' ? 继续
   ├─ tenant.expire_date > today ? 继续
   └─ 否则返回 403 "租户已过期"
   │
   ▼
3. 校验模块授权
   ├─ tenant_module_licenses 中存在 (tenant_id, 'equipment') 且 active ? 继续
   └─ 否则返回 403 "未开通该模块"
   │
   ▼
4. 校验用户模块权限
   ├─ user_module_permissions 中 user_id 拥有 'equipment' ? 继续
   └─ 否则返回 403 "无模块使用权限"
   │
   ▼
5. RBAC 校验
   ├─ 用户角色拥有 /equipment/list 的访问权限 ? 继续
   └─ 否则返回 403 "无接口权限"
   │
   ▼
6. ABAC 数据范围校验
   ├─ 查询结果自动附加 user_data_scopes 中的车间/部门过滤
   └─ 若无数据范围限制，则可见全部租户数据
   │
   ▼
7. 执行业务逻辑
```

---

## 5. 初始化 SQL

```sql
-- 1. 创建平台模块
INSERT INTO platform_modules (module_code, module_name, module_category, description, default_price) VALUES
('ehs', 'EHS安全管理', 'safety', '隐患排查、作业票、变更管理', 2999.00),
('equipment', '设备管理', 'equipment', '设备台账、检维修、特种设备', 1999.00),
('mes', '生产执行', 'production', '生产调度、工艺管理', 4999.00),
('ai_chat', 'AI智能助手', 'ai', '自然语言查询和对话', 999.00),
('mobile_hazard', '语音报隐患', 'safety', '移动端语音快速上报隐患', 599.00);

-- 2. 创建首个平台超管
INSERT INTO users (tenant_id, username, password_hash, real_name, role, status)
VALUES (NULL, 'superadmin', '$2b$10$...', '系统超管', 'super_admin', 'active');
```
