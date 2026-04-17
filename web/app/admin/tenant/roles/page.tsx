"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { tenantAdminApi, RoleItem } from "@/lib/api";
import {
  Search,
  Plus,
  Shield,
  Users,
  Package,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";

interface ModuleOption {
  code: string;
  name: string;
}

export default function TenantRolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, modulesRes] = await Promise.all([
        tenantAdminApi.listRoles(),
        tenantAdminApi.getModules(),
      ]);
      setRoles(rolesRes);
      setModules(
        Array.isArray(modulesRes)
          ? (modulesRes as { moduleCode: string; moduleName: string }[]).map((l) => ({
              code: l.moduleCode,
              name: l.moduleName,
            }))
          : []
      );
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const startEdit = (role: RoleItem) => {
    setEditingRole(role);
    setRoleName(role.roleName);
    setDescription(role.description || "");
    setSelectedModules(role.permissions.map((p) => p.moduleCode));
    setOpen(true);
  };

  const startCreate = () => {
    setEditingRole(null);
    setRoleName("");
    setDescription("");
    setSelectedModules([]);
    setOpen(true);
  };

  const toggleModule = (code: string) => {
    setSelectedModules((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const submit = async () => {
    try {
      const payload = {
        roleName,
        description,
        moduleCodes: selectedModules,
      };
      if (editingRole) {
        await tenantAdminApi.updateRole(editingRole.id, payload);
      } else {
        await tenantAdminApi.createRole(payload);
      }
      setOpen(false);
      fetchData();
    } catch (e: unknown) {
      alert((e as Error).message || "操作失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除该角色吗？关联用户将失去此角色的权限。")) return;
    try {
      await tenantAdminApi.deleteRole(id);
      fetchData();
    } catch (e: unknown) {
      alert((e as Error).message || "删除失败");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">角色管理</h1>
          <p className="text-sm text-muted-foreground">
            创建自定义角色，为角色分配模块权限，再将角色批量授予用户
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={startCreate}>
              <Plus className="w-4 h-4 mr-1" />
              新建角色
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingRole ? "编辑角色" : "新建角色"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>角色名称</Label>
                <Input
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="例如：安全总监"
                />
              </div>
              <div className="space-y-1.5">
                <Label>角色描述</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="简要说明该角色的职责范围"
                />
              </div>
              <div className="space-y-2">
                <Label>分配模块权限</Label>
                <div className="border rounded-lg p-3 space-y-2">
                  {modules.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      暂无已开通模块，请联系平台管理员购买模块。
                    </div>
                  )}
                  {modules.map((mod) => (
                    <div key={mod.code} className="flex items-center gap-2">
                      <Checkbox
                        id={`mod-${mod.code}`}
                        checked={selectedModules.includes(mod.code)}
                        onCheckedChange={() => toggleModule(mod.code)}
                      />
                      <label htmlFor={`mod-${mod.code}`} className="text-sm cursor-pointer">
                        {mod.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  取消
                </Button>
                <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={submit}>
                  保存
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="搜索角色名称" className="pl-9 h-9" />
            </div>
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
                  <th className="text-left px-3 py-2 font-medium">角色名称</th>
                  <th className="text-left px-3 py-2 font-medium">描述</th>
                  <th className="text-left px-3 py-2 font-medium">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      关联用户
                    </div>
                  </th>
                  <th className="text-left px-3 py-2 font-medium">
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      模块权限
                    </div>
                  </th>
                  <th className="text-left px-3 py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {roles.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyan-600" />
                        <span className="font-medium">{r.roleName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground max-w-xs truncate">
                      {r.description || "-"}
                    </td>
                    <td className="px-3 py-3">{r._count?.userRoles ?? 0} 人</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {r.permissions.map((p) => {
                          const mod = modules.find((m) => m.code === p.moduleCode);
                          return (
                            <Badge key={p.moduleCode} variant="outline" className="text-xs">
                              {mod?.name || p.moduleCode}
                            </Badge>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-cyan-600"
                          onClick={() => startEdit(r)}
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" />
                          编辑
                        </Button>
                        {!r.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-600"
                            onClick={() => handleDelete(r.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
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
