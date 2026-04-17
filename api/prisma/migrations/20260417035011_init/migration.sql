-- CreateTable
CREATE TABLE "platform_modules" (
    "id" BIGSERIAL NOT NULL,
    "module_code" VARCHAR(64) NOT NULL,
    "module_name" VARCHAR(128) NOT NULL,
    "module_category" VARCHAR(64),
    "description" TEXT,
    "icon" VARCHAR(128),
    "default_price" DECIMAL(10,2),
    "depends_on" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" BIGSERIAL NOT NULL,
    "tenant_code" VARCHAR(64) NOT NULL,
    "tenant_name" VARCHAR(128) NOT NULL,
    "tenant_type" VARCHAR(32),
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "subscription_plan" VARCHAR(32),
    "start_date" DATE,
    "expire_date" DATE,
    "max_users" INTEGER NOT NULL DEFAULT 10,
    "max_storage_gb" INTEGER NOT NULL DEFAULT 50,
    "contact_name" VARCHAR(64),
    "contact_phone" VARCHAR(32),
    "contact_email" VARCHAR(128),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_module_licenses" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" BIGINT NOT NULL,
    "module_code" VARCHAR(64) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "start_date" DATE,
    "expire_date" DATE,
    "max_users" INTEGER,
    "custom_price" DECIMAL(10,2),
    "config_json" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_module_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" BIGINT,
    "username" VARCHAR(64) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "real_name" VARCHAR(64),
    "phone" VARCHAR(32),
    "email" VARCHAR(128),
    "avatar_url" VARCHAR(255),
    "role" VARCHAR(32) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMPTZ(6),
    "last_login_ip" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_module_permissions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "module_code" VARCHAR(64) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'granted',
    "granted_by" BIGINT,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_module_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_data_scopes" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "scope_type" VARCHAR(32) NOT NULL,
    "scope_id" BIGINT NOT NULL,
    "scope_name" VARCHAR(64),

    CONSTRAINT "user_data_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "tenant_id" BIGINT,
    "username" VARCHAR(64),
    "login_type" VARCHAR(16),
    "ip_address" INET,
    "user_agent" TEXT,
    "status" VARCHAR(16),
    "fail_reason" VARCHAR(128),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "tenant_id" BIGINT,
    "action" VARCHAR(64) NOT NULL,
    "resource_type" VARCHAR(64),
    "resource_id" BIGINT,
    "before_data" JSONB,
    "after_data" JSONB,
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_modules_module_code_key" ON "platform_modules"("module_code");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_tenant_code_key" ON "tenants"("tenant_code");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateIndex
CREATE INDEX "tenants_expire_date_idx" ON "tenants"("expire_date");

-- CreateIndex
CREATE INDEX "tenant_module_licenses_tenant_id_idx" ON "tenant_module_licenses"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_module_licenses_expire_date_idx" ON "tenant_module_licenses"("expire_date");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_module_licenses_tenant_id_module_code_key" ON "tenant_module_licenses"("tenant_id", "module_code");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_username_key" ON "users"("tenant_id", "username");

-- CreateIndex
CREATE UNIQUE INDEX "user_module_permissions_user_id_module_code_key" ON "user_module_permissions"("user_id", "module_code");

-- CreateIndex
CREATE INDEX "user_data_scopes_user_id_idx" ON "user_data_scopes"("user_id");

-- AddForeignKey
ALTER TABLE "tenant_module_licenses" ADD CONSTRAINT "tenant_module_licenses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_module_licenses" ADD CONSTRAINT "tenant_module_licenses_module_code_fkey" FOREIGN KEY ("module_code") REFERENCES "platform_modules"("module_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_module_permissions" ADD CONSTRAINT "user_module_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_data_scopes" ADD CONSTRAINT "user_data_scopes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_logs" ADD CONSTRAINT "operation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
