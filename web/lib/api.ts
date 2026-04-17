import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { getToken, removeToken } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3451";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = getToken();
        // eslint-disable-next-line no-console
        console.log('[API REQUEST]', config.method?.toUpperCase(), config.url, 'token?', !!token);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ message?: string }>) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;

        if (status === 401 || status === 403) {
          removeToken();
          if (typeof window !== "undefined" && window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }

        // Return a rejected error with a clear message for UI handling
        return Promise.reject(new Error(message));
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    const res = await this.client.get<T>(url, config);
    return res.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    const res = await this.client.post<T>(url, data, config);
    return res.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    const res = await this.client.put<T>(url, data, config);
    return res.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const res = await this.client.delete<T>(url, config);
    return res.data;
  }
}

export const api = new ApiClient();

// Typed API wrappers
export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    userId: string;
    username: string;
    role: string;
    tenantId?: string;
    tenantCode?: string;
    tenantStatus?: string;
    modules: string[];
  };
}

export const authApi = {
  login: (payload: LoginPayload) => api.post<LoginResponse>("/auth/login", payload),
};

export interface TenantItem {
  id: string;
  tenantCode: string;
  tenantName: string;
  tenantType?: string;
  status: string;
  subscriptionPlan?: string;
  startDate?: string;
  expireDate?: string;
  maxUsers: number;
  maxStorageGb: number;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  userCount?: number;
  moduleCount?: number;
  createdAt: string;
}

export interface TenantListResponse {
  data: TenantItem[];
  total: number;
}

export const platformAdminApi = {
  // Tenants
  listTenants: (params?: { status?: string; plan?: string; skip?: number; take?: number }) =>
    api.get<TenantListResponse>("/admin/platform/tenants", { params }),
  getTenant: (id: number | string) => api.get<TenantItem>(`/admin/platform/tenants/${id}`),
  createTenant: (payload: Record<string, unknown>) =>
    api.post<TenantItem>("/admin/platform/tenants", payload),
  updateTenant: (id: number | string, payload: Record<string, unknown>) =>
    api.put<TenantItem>(`/admin/platform/tenants/${id}`, payload),

  // Modules
  listModules: () => api.get<unknown>("/admin/platform/modules"),
  createModule: (payload: Record<string, unknown>) =>
    api.post("/admin/platform/modules", payload),
  updateModule: (id: number | string, payload: Record<string, unknown>) =>
    api.put(`/admin/platform/modules/${id}`, payload),

  // Licenses
  getLicenses: (tenantId: number | string) =>
    api.get<unknown>(`/admin/platform/licenses/${tenantId}`),
  saveLicense: (tenantId: number | string, payload: Record<string, unknown>) =>
    api.post(`/admin/platform/licenses/${tenantId}`, payload),
};

export interface RoleItem {
  id: string;
  tenantId: string;
  roleName: string;
  description?: string;
  isDefault: boolean;
  status: string;
  createdAt: string;
  permissions: Array<{
    id: string;
    moduleCode: string;
    actions: string[];
    module: {
      moduleCode: string;
      moduleName: string;
    };
  }>;
  _count?: {
    userRoles: number;
  };
}

export interface UserItem {
  id: string;
  tenantId?: string;
  username: string;
  realName?: string;
  phone?: string;
  email?: string;
  role: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
  userRoles: Array<{
    roleId: string;
    role: RoleItem;
  }>;
  modulePerms: Array<{
    moduleCode: string;
  }>;
  dataScopes: Array<{
    scopeType: string;
    scopeId: string;
    scopeName?: string;
  }>;
}

export interface TenantInfo {
  id: string;
  tenantCode: string;
  tenantName: string;
  subscriptionPlan?: string;
  expireDate?: string;
  maxUsers: number;
  maxStorageGb: number;
  status: string;
  licenses: Array<{
    moduleCode: string;
    module: {
      moduleCode: string;
      moduleName: string;
      moduleCategory?: string;
    };
  }>;
  _count: {
    users: number;
    roles: number;
  };
}

export const tenantAdminApi = {
  // Info
  getInfo: () => api.get<TenantInfo>("/admin/tenant/info"),

  // Roles
  listRoles: () => api.get<RoleItem[]>("/admin/tenant/roles"),
  createRole: (payload: Record<string, unknown>) =>
    api.post<RoleItem>("/admin/tenant/roles", payload),
  updateRole: (id: number | string, payload: Record<string, unknown>) =>
    api.put<RoleItem>(`/admin/tenant/roles/${id}`, payload),
  deleteRole: (id: number | string) => api.delete(`/admin/tenant/roles/${id}`),

  // Users
  listUsers: (params?: { skip?: number; take?: number }) =>
    api.get<{ data: UserItem[]; total: number }>("/admin/tenant/users", { params }),
  createUser: (payload: Record<string, unknown>) =>
    api.post<UserItem>("/admin/tenant/users", payload),
  updateUser: (id: number | string, payload: Record<string, unknown>) =>
    api.put<UserItem>(`/admin/tenant/users/${id}`, payload),

  // Modules
  getModules: () => api.get<unknown>("/admin/tenant/modules"),
};
