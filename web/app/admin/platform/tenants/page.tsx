"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { platformAdminApi, TenantItem } from "@/lib/api";
import {
  Search,
  Plus,
  MoreHorizontal,
  KeyRound,
  Users,
  Calendar,
  Loader2,
} from "lucide-react";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TenantItem | null>(null);
  const [form, setForm] = useState<Record<string, string | number | undefined>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await platformAdminApi.listTenants();
      setTenants(res.data);
    } catch {
      // handled by api interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const startCreate = () => {
    setEditing(null);
    setForm({
      subscriptionPlan: "basic",
      maxUsers: 10,
      adminUsername: "admin",
      adminPassword: "admin123",
    });
    setOpen(true);
  };

  const startEdit = (t: TenantItem) => {
    setEditing(t);
    setForm({
      tenantName: t.tenantName,
      tenantType: t.tenantType || "production",
      subscriptionPlan: t.subscriptionPlan || "basic",
      expireDate: t.expireDate ? t.expireDate.slice(0, 10) : "",
      maxUsers: t.maxUsers,
      contactName: t.contactName || "",
      contactPhone: t.contactPhone || "",
      contactEmail: t.contactEmail || "",
      status: t.status,
    });
    setOpen(true);
  };

  const submit = async () => {
    try {
      if (editing) {
        await platformAdminApi.updateTenant(editing.id, form);
      } else {
        await platformAdminApi.createTenant(form);
      }
      setOpen(false);
      fetchData();
    } catch (e: unknown) {
      alert((e as Error).message || "操作失败");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">租户管理</h1>
          <p className="text-sm text-muted-foreground">
            管理平台所有企业租户的生命周期、套餐与模块授权
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={startCreate}>
              <Plus className="w-4 h-4 mr-1" />
              新建租户
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "编辑租户" : "新建租户"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 pt-2">
              {!editing && (
                <>
                  <div className="space-y-1.5">
                    <Label>租户编码</Label>
                    <Input
                      value={form.tenantCode || ""}
                      onChange={(e) => setForm({ ...form, tenantCode: e.target.value })}
                      placeholder="例如：HT-CHEM-001"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>初始管理员账号</Label>
                    <Input
                      value={form.adminUsername || ""}
                      onChange={(e) => setForm({ ...form, adminUsername: e.target.value })}
                      placeholder="admin"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>初始管理员密码</Label>
                    <Input
                      value={form.adminPassword || ""}
                      onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                      placeholder="******"
                    />
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label>企业名称</Label>
                <Input
                  value={form.tenantName || ""}
                  onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
                  placeholder="例如：江苏恒泰化工有限公司"
                />
              </div>
              <div className="space-y-1.5">
                <Label>行业类型</Label>
                <Select
                  value={(form.tenantType as string) || "production"}
                  onValueChange={(v) => setForm({ ...form, tenantType: v as string })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">生产型</SelectItem>
                    <SelectItem value="trade">贸易型</SelectItem>
                    <SelectItem value="storage">仓储型</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>套餐</Label>
                <Select
                  value={(form.subscriptionPlan as string) || "basic"}
                  onValueChange={(v) => setForm({ ...form, subscriptionPlan: v as string })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">基础版</SelectItem>
                    <SelectItem value="pro">专业版</SelectItem>
                    <SelectItem value="enterprise">企业版</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>到期日</Label>
                <Input
                  type="date"
                  value={form.expireDate || ""}
                  onChange={(e) => setForm({ ...form, expireDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>最大用户数</Label>
                <Input
                  type="number"
                  value={form.maxUsers || 10}
                  onChange={(e) => setForm({ ...form, maxUsers: parseInt(e.target.value, 10) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>联系人</Label>
                <Input
                  value={form.contactName || ""}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  placeholder="例如：张经理"
                />
              </div>
              <div className="space-y-1.5">
                <Label>联系电话</Label>
                <Input
                  value={form.contactPhone || ""}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="13800138000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>联系邮箱</Label>
                <Input
                  value={form.contactEmail || ""}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  placeholder="contact@example.com"
                />
              </div>
              {editing && (
                <div className="space-y-1.5">
                  <Label>状态</Label>
                  <Select
                    value={(form.status as string) || "active"}
                    onValueChange={(v) => setForm({ ...form, status: v as string })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">正常</SelectItem>
                      <SelectItem value="inactive">停用</SelectItem>
                      <SelectItem value="expired">已过期</SelectItem>
                      <SelectItem value="suspended">已冻结</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={submit}>
                保存
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="搜索租户名称/编码" className="pl-9 h-9" />
            </div>
            <Button variant="outline" size="sm" className="h-9">
              全部状态
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              全部套餐
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">租户编码</th>
                  <th className="text-left px-3 py-2 font-medium">企业名称</th>
                  <th className="text-left px-3 py-2 font-medium">套餐</th>
                  <th className="text-left px-3 py-2 font-medium">到期日</th>
                  <th className="text-left px-3 py-2 font-medium">用户数</th>
                  <th className="text-left px-3 py-2 font-medium">已开通模块</th>
                  <th className="text-left px-3 py-2 font-medium">状态</th>
                  <th className="text-left px-3 py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 font-mono text-muted-foreground">
                      {t.tenantCode}
                    </td>
                    <td className="px-3 py-3 font-medium">{t.tenantName}</td>
                    <td className="px-3 py-3">
                      <Badge variant="outline" className="capitalize">
                        {t.subscriptionPlan || "-"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {t.expireDate ? t.expireDate.slice(0, 10) : "-"}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        {t.userCount ?? 0}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-muted-foreground" />
                        {t.moduleCount ?? 0} 个
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {t.status === "active" && (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          正常
                        </Badge>
                      )}
                      {t.status === "inactive" && (
                        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                          停用
                        </Badge>
                      )}
                      {t.status === "expired" && (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                          已过期
                        </Badge>
                      )}
                      {t.status === "suspended" && (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                          已冻结
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-cyan-600"
                          onClick={() => startEdit(t)}
                        >
                          编辑
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-cyan-600">
                          授权
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
