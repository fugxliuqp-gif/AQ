# SaaS 架构设计方案

## 1. 架构定位

本平台采用 **SaaS 多租户架构**，服务于多个化工企业租户。平台分为三层：

1. **平台运营层（Platform）**：超级管理员运营后台
2. **租户应用层（Tenant）**：各企业使用的业务系统
3. **租户管理层（Tenant Admin）**：企业内部管理员后台

---

## 2. 租户隔离策略

### 2.1 方案选择：共享数据库 + Tenant_ID 行级隔离

| 方案 | 优点 | 缺点 | 本方案选择 |
|---|---|---|---|
| 独立数据库 | 隔离性最强 | 成本高、运维复杂 | ❌ |
| 共享数据库 + Schema 隔离 | 中等隔离、弹性好 | 跨租户统计复杂、Schema 迁移成本高 | ❌ |
| **共享数据库 + Tenant_ID** | 成本低、扩展灵活、统一运维 | 需严格代码层过滤 | ✅ |

### 2.2 数据隔离规则
- 所有业务表必须包含 `tenant_id` 字段（BIGINT，NOT NULL）
- 数据库连接池统一，通过应用层的 **Tenant Context** 自动附加 `WHERE tenant_id = ?`
- 超管后台查询可跨租户，但默认仍需显式指定租户条件
- 文件存储（MinIO/OSS）按 `tenant/{tenantId}/` 前缀隔离
- Redis Key 前缀：`tenant:{tenantId}:session:*`

### 2.3 多租户中间件设计

```
用户请求
   │
   ▼
[ Nginx / API Gateway ]
   │ 解析 JWT 中的 tenant_id
   ▼
[ Tenant Resolution Middleware ]
   │ 1. 从 JWT/Header/Subdomain 提取 tenant_id
   │ 2. 校验租户状态（是否过期、是否禁用）
   │ 3. 校验用户是否有该租户权限
   │ 4. 将 tenant_id 注入 ThreadLocal / AsyncLocalStorage
   ▼
[ Business API ]
   │ 自动追加 tenant_id 到所有 SQL 查询
   ▼
[ PostgreSQL ]
```

---

## 3. 账户与权限体系

### 3.1 三层账户模型

```
┌─────────────────────────────────────────────────────────────┐
│                    平台超级管理员（Super Admin）               │
│  • 管理所有租户的生命周期（创建、停用、续期、删除）             │
│  • 管理平台功能模块（定价、开关、版本）                        │
│  • 查看平台级运营数据（租户数、活跃用户数、收入统计）            │
│  • 拥有上帝视角，但不查看任何企业业务数据                       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌─────────┐     ┌─────────┐     ┌─────────┐
        │ 租户A   │     │ 租户B   │     │ 租户C   │
        │ 企业A   │     │ 企业B   │     │ 企业C   │
        └────┬────┘     └────┬────┘     └────┬────┘
             │               │               │
    ┌────────┴────────┐      │               │
    ▼                 ▼      │               │
┌─────────┐      ┌────────┐  │               │
│ 企业管理员 │      │ 普通用户 │  │               │
│TenantAdmin│      │  User  │  │               │
└─────────┘      └────────┘  │               │
```

### 3.2 角色定义

| 角色 | 范围 | 权限说明 |
|---|---|---|
| `SUPER_ADMIN` | 平台级 | 租户管理、模块管理、订阅管理、平台配置、系统监控 |
| `TENANT_ADMIN` | 租户级 | 企业信息管理、用户管理（增删改查）、角色分配、模块使用配置、数据权限分配 |
| `TENANT_USER` | 租户级 | 使用被授权的业务模块，无管理权限 |
| `AUDITOR` | 租户级 | 只读查看（可选角色，满足化工审计需求） |

### 3.3 权限模型：RBAC + ABAC 混合

**RBAC（基于角色）**：控制菜单、按钮、API 的可见性
**ABAC（基于属性）**：控制数据范围，如"只能看三车间数据"

```
用户 → 角色 → 权限（RBAC）
用户 → 部门/车间属性 → 数据范围（ABAC）
```

---

## 4. 核心数据模型

### 4.1 租户表（tenants）

```sql
CREATE TABLE tenants (
    id              BIGSERIAL PRIMARY KEY,
    tenant_code     VARCHAR(64) UNIQUE NOT NULL,    -- 企业编码（用于子域、API）
    tenant_name     VARCHAR(128) NOT NULL,          -- 企业名称
    tenant_type     VARCHAR(32),                    -- 生产型/贸易型/仓储型
    status          VARCHAR(16) DEFAULT 'active',   -- active/inactive/expired/suspended
    
    -- 订阅信息
    subscription_plan VARCHAR(32),                  -- basic/pro/enterprise
    start_date      DATE,                           -- 服务开始日期
    expire_date     DATE,                           -- 服务到期日期（核心字段）
    max_users       INT DEFAULT 10,                 -- 最大用户数
    max_storage_gb  INT DEFAULT 50,                 -- 最大存储空间
    
    -- 联系信息
    contact_name    VARCHAR(64),
    contact_phone   VARCHAR(32),
    contact_email   VARCHAR(128),
    
    -- 审计
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      BIGINT                          -- 超管ID
);
```

### 4.2 平台功能模块表（platform_modules）

```sql
CREATE TABLE platform_modules (
    id              BIGSERIAL PRIMARY KEY,
    module_code     VARCHAR(64) UNIQUE NOT NULL,    -- 模块编码：ehs/equipment/mes/ai_chat/...
    module_name     VARCHAR(128) NOT NULL,          -- 模块名称
    module_category VARCHAR(64),                    -- 分类：安全/设备/生产/AI
    description     TEXT,
    icon            VARCHAR(128),
    default_price   DECIMAL(10,2),                  -- 默认单价（元/月）
    status          VARCHAR(16) DEFAULT 'active'    -- active/deprecated
);
```

### 4.3 租户模块授权表（tenant_module_licenses）

```sql
CREATE TABLE tenant_module_licenses (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenants(id),
    module_code     VARCHAR(64) NOT NULL REFERENCES platform_modules(module_code),
    
    -- 授权配置
    status          VARCHAR(16) DEFAULT 'active',   -- active/inactive/pending
    start_date      DATE,
    expire_date     DATE,                           -- 模块独立到期日（支持按模块付费）
    max_users       INT,                            -- 该模块可分配的用户数上限
    custom_price    DECIMAL(10,2),                  -- 实际成交价格
    
    -- 配置参数（JSON）
    config_json     JSONB DEFAULT '{}',             -- 模块级配置，如 AI 对话的每日次数限制
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, module_code)
);
```

### 4.4 用户表（users）

```sql
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT REFERENCES tenants(id),  -- 平台级管理员为 NULL
    username        VARCHAR(64) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    
    -- 基本信息
    real_name       VARCHAR(64),
    phone           VARCHAR(32),
    email           VARCHAR(128),
    avatar_url      VARCHAR(255),
    
    -- 角色
    role            VARCHAR(32) NOT NULL,           -- super_admin/tenant_admin/tenant_user/auditor
    
    -- 状态
    status          VARCHAR(16) DEFAULT 'active',   -- active/inactive/locked
    last_login_at   TIMESTAMPTZ,
    last_login_ip   INET,
    
    -- 审计
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      BIGINT,
    
    -- 唯一约束：租户内用户名唯一，平台级管理员用户名全局唯一
    UNIQUE(tenant_id, username)
);
```

### 4.5 用户模块权限表（user_module_permissions）

用于精细化控制：企业内的某个用户是否可以使用某个已授权的模块。

```sql
CREATE TABLE user_module_permissions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    module_code     VARCHAR(64) NOT NULL,
    
    status          VARCHAR(16) DEFAULT 'granted',  -- granted/revoked
    granted_by      BIGINT,                         -- 分配人（企业管理员）
    granted_at      TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, module_code)
);
```

### 4.6 数据权限范围表（user_data_scopes）

ABAC：控制用户能访问哪些车间/部门的数据。

```sql
CREATE TABLE user_data_scopes (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    scope_type      VARCHAR(32) NOT NULL,           -- dept/workshop/project
    scope_id        BIGINT NOT NULL,                -- 对应车间ID等
    scope_name      VARCHAR(64)                     -- 冗余存储，方便展示
);
```

### 4.7 登录审计表（login_logs）

```sql
CREATE TABLE login_logs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT,
    tenant_id       BIGINT,
    username        VARCHAR(64),
    login_type      VARCHAR(16),                    -- password/sso/otp
    ip_address      INET,
    user_agent      TEXT,
    status          VARCHAR(16),                    -- success/failed
    fail_reason     VARCHAR(128),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. 超管后台功能设计

### 5.1 租户管理
- **租户列表**：展示所有租户的基本信息、到期状态、已开通模块数
- **创建租户**：填写企业信息、选择订阅套餐、设置有效期、生成初始企业管理员账号
- **编辑租户**：修改企业信息、续期、升级套餐、停用/启用
- **租户详情**：查看该租户的用户数、存储用量、登录日志、开通模块清单

### 5.2 模块管理
- **模块列表**：管理平台所有可售卖的业务模块
- **模块配置**：设置模块名称、图标、默认价格、依赖关系
- **版本控制**：模块的发布/下线、灰度策略

### 5.3 订阅与授权管理
- **授权分配**：为指定租户开通/关闭某个模块
- **批量操作**：批量续期、批量调整模块权限
- **到期预警**：自动标记 30 天内到期的租户，支持一键发送续费提醒

### 5.4 平台用户管理
- **超管账户**：创建/编辑/删除平台超级管理员
- **操作审计**：记录所有超管的关键操作（创建租户、修改授权、删除数据）

### 5.5 运营看板
- 租户总数、今日新增、到期预警数
- 模块开通分布（饼图）
- 租户活跃度排行（按登录频次）
- 收入统计（按模块/按租户/按月）

---

## 6. 企业管理员后台功能设计

每个租户内部拥有一个独立的企业管理后台，用于：

### 6.1 企业信息
- 查看企业基本资料、订阅有效期、已开通模块
- 修改企业联系信息（部分字段只读）

### 6.2 用户与权限管理
- **用户列表**：增删改查企业内部用户
- **邀请用户**：通过手机号/邮箱邀请，生成初始密码
- **角色分配**：将用户设为 企业管理员 / 普通用户 / 审计员
- **模块分配**：在平台已授权的模块中，控制每个用户能使用哪些模块
- **数据范围**：设置用户可见的车间/部门（ABAC）

### 6.3 组织架构
- 部门/车间管理（树形结构）
- 岗位管理

---

## 7. 关键业务规则

### 7.1 租户过期处理
| 状态 | 规则 |
|---|---|
| **到期前 30 天** | 超管后台标红预警；企业管理员登录后弹窗提醒续费 |
| **到期当天** | 租户状态变为 `expired`，所有普通用户禁止登录；企业管理员仍可登录但只能看不能操作 |
| **到期后 7 天** | 进入宽限期，数据保留，但业务功能全部锁定 |
| **到期后 30 天** | 自动归档数据，租户进入 `suspended` 状态，仅超管可见 |

### 7.2 模块授权校验链
```
用户请求某模块 API
   │
   ▼
1. 校验用户 JWT 是否有效
2. 校验租户状态（是否过期、是否禁用）
3. 校验租户是否拥有该模块的授权（tenant_module_licenses）
4. 校验用户个人是否被分配了该模块（user_module_permissions）
5. 校验用户角色是否有该 API 的 RBAC 权限
6. 校验用户数据范围（ABAC）
7. 通过，执行业务逻辑
```

### 7.3 用户配额管理
- 企业管理员创建用户时，受租户 `max_users` 限制
- 超出配额时，提示"请联系平台升级套餐"
- 超管可单独为某个租户调整 `max_users`（不绑定套餐）

---

## 8. 技术实现要点

### 8.1 JWT 结构设计
```json
{
  "sub": "10086",
  "username": "zhangsan",
  "role": "tenant_admin",
  "tenant_id": 12,
  "tenant_code": "chem-corp-a",
  "tenant_status": "active",
  "modules": ["ehs", "equipment", "ai_chat"],
  "iat": 1713340000,
  "exp": 1713426400
}
```

### 8.2 数据库查询自动注入 Tenant_ID
在 ORM 层（如 Prisma/TypeORM/Sequelize）通过全局拦截器实现：
- 所有 `SELECT/UPDATE/DELETE` 自动追加 `tenant_id = currentTenantId`
- 超管查询带特殊标记 `ignoreTenantFilter = true` 时才跳过
- `INSERT` 时自动从 Tenant Context 填充 `tenant_id`

### 8.3 前端路由隔离
- 超管后台：`/admin/platform/*` 或 `admin.platform.com`
- 企业管理后台：`/admin/tenant/*` 或 `admin.{tenantCode}.com`
- 业务系统：`/app/*` 或 `{tenantCode}.app.com`
- 建议本期使用路径隔离，降低部署复杂度

---

## 9. 演进路线

### Phase 1（MVP）：单平台 + 基础租户管理
- 超管后台：创建租户、设置有效期、开通模块
- 企业后台：管理内部用户
- 业务系统：不带业务，只验证租户隔离和登录

### Phase 2：订阅计费
- 接入 stripe/支付宝/微信支付
- 按模块、按用户数、按存储的计费模型
- 自动续费、发票管理

### Phase 3：多环境支持
- 支持独立部署环境（私有化 SaaS）
- 支持租户级别的数据库备份策略
- 支持数据导出（满足化工企业退出时的数据迁移需求）

---

**文档版本**：v1.0  
**创建日期**：2025-04-17
