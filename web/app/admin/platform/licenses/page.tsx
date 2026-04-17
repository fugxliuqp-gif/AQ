"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { platformAdminApi, TenantItem } from "@/lib/api";
import {
  Building2,
  Package,
  Calendar,
  Users,
  Save,
  Loader2,
} from "lucide-react";

interface LicenseState {
  tenantId: number;
  moduleCode: string;
  status: boolean;
  expireDate: string;
  maxUsers: number;
}

interface ApiLicense {
  moduleCode: string;
  status: string;
  expireDate?: string;
  maxUsers?: number;
}

interface ModuleItem {
  moduleCode: string;
  moduleName: string;
  moduleCategory?: string;
}

export default function LicensesPage() {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [licenses, setLicenses] = useState<Record<string, LicenseState>>({});
  const [loading, setLoading] = useState(false);
  

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tenantsRes, modulesRes] = await Promise.all([
        platformAdminApi.listTenants(),
        platformAdminApi.listModules(),
      ]);
      setTenants(tenantsRes.data);
      setModules(modulesRes as ModuleItem[]);

      // Fetch licenses for each tenant
      const licenseMap: Record<string, LicenseState> = {};
      await Promise.all(
        tenantsRes.data.map(async (t) => {
          const list = await platformAdminApi.getLicenses(t.id);
          (list as ApiLicense[]).forEach((l) => {
            licenseMap[`${t.id}-${l.moduleCode}`] = {
              tenantId: Number(t.id),
              moduleCode: l.moduleCode,
              status: l.status === "active",
              expireDate: l.expireDate ? l.expireDate.slice(0, 10) : "",
              maxUsers: l.maxUsers || 0,
            };
          });
        })
      );
      setLicenses(licenseMap);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateLicenseField = (
    tenantId: number,
    moduleCode: string,
    key: keyof LicenseState,
    value: string | number | boolean
  ) => {
    const mapKey = `${tenantId}-${moduleCode}`;
    setLicenses((prev) => ({
      ...prev,
      [mapKey]: {
        ...prev[mapKey],
        tenantId,
        moduleCode,
        [key]: value,
      },
    }));
  };


  const saveTenantLicenses = async (tenantId: number) => {
    const items = Object.values(licenses).filter((l) => l.tenantId === tenantId);
    await Promise.all(
      items.map((l) =>
        platformAdminApi.saveLicense(tenantId, {
          moduleCode: l.moduleCode,
          status: l.status ? "active" : "inactive",
          expireDate: l.status && l.expireDate ? l.expireDate : undefined,
          maxUsers: l.status ? Number(l.maxUsers) || 0 : 0,
        })
      )
    );
    alert("保存成功");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">授权管理</h1>
          <p className="text-sm text-muted-foreground">
            为租户分配功能模块、设置模块有效期与使用配额
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {tenants.map((tenant) => (
            <Card key={tenant.id}>
              <CardHeader className="pb-3 border-b bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-600" />
                    <span className="font-semibold text-sm">{tenant.tenantName}</span>
                    <Badge variant="outline" className="ml-2">
                      ID: {tenant.id}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    className="bg-cyan-600 hover:bg-cyan-700"
                    onClick={() => saveTenantLicenses(Number(tenant.id))}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    保存该租户授权
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium w-48">
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          模块
                        </div>
                      </th>
                      <th className="text-left px-4 py-2 font-medium">开通状态</th>
                      <th className="text-left px-4 py-2 font-medium">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          有效期至
                        </div>
                      </th>
                      <th className="text-left px-4 py-2 font-medium">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          最大用户数
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {modules.map((mod) => {
                      const lic = licenses[`${tenant.id}-${mod.moduleCode}`] || {
                        status: false,
                        expireDate: "",
                        maxUsers: 0,
                      };
                      return (
                        <tr key={`${tenant.id}-${mod.moduleCode}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium">{mod.moduleName}</div>
                            <div className="text-xs text-muted-foreground">
                              {mod.moduleCategory || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={lic.status}
                                onCheckedChange={(v) => {
                                  updateLicenseField(
                                    Number(tenant.id),
                                    mod.moduleCode,
                                    "status",
                                    v
                                  );
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {lic.status ? (
                              <Input
                                type="date"
                                className="h-8 w-40"
                                value={lic.expireDate}
                                onChange={(e) =>
                                  updateLicenseField(
                                    Number(tenant.id),
                                    mod.moduleCode,
                                    "expireDate",
                                    e.target.value
                                  )
                                }
                              />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {lic.status ? (
                              <Input
                                type="number"
                                className="h-8 w-24"
                                value={lic.maxUsers}
                                onChange={(e) =>
                                  updateLicenseField(
                                    Number(tenant.id),
                                    mod.moduleCode,
                                    "maxUsers",
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                              />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
