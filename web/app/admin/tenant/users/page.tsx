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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tenantAdminApi, UserItem, RoleItem } from "@/lib/api";
import {
  Search,
  Plus,
  MoreHorizontal,
  Shield,
  User,
  Eye,
  Pencil,
  Loader2,
} from "lucide-react";

export default function TenantUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [form, setForm] = useState<Record<string, string | number | string[] | undefined>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        tenantAdminApi.listUsers(),
        tenantAdminApi.listRoles(),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = (user?: UserItem) => {
    if (user) {
      setEditingUser(user);
      setForm({
        username: user.username,
        realName: user.realName || "",
        phone: user.phone || "",
        email: user.email || "",
        role: user.role,
        status: user.status,
      });
      setSelectedRoles(user.userRoles.map((ur) => ur.roleId));
    } else {
      setEditingUser(null);
      setForm({
        username: "",
        password: "",
        realName: "",
        phone: "",
        email: "",
        role: "tenant_user",
        status: "active",
      });
      setSelectedRoles([]);
    }
  };

  const startCreate = () => {
    resetForm();
    setOpen(true);
  };

  const startEdit = (user: UserItem) => {
    resetForm(user);
    setOpen(true);
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const submit = async () => {
    try {
      const payload = {
        ...form,
        roleIds: selectedRoles.map((id) => parseInt(id, 10)),
      };
      if (editingUser) {
        await tenantAdminApi.updateUser(editingUser.id, payload);
      } else {
        await tenantAdminApi.createUser(payload);
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
          <h1 className="text-2xl font-bold">用户管理</h1>
          <p className="text-sm text-muted-foreground">
            管理企业内部用户账号、角色及模块使用权限
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={startCreate}>
              <Plus className="w-4 h-4 mr-1" />
              新增用户
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{editingUser ? "编辑用户" : "新增用户"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>用户名/工号</Label>
                  <Input
                    disabled={!!editingUser}
                    value={form.username || ""}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="例如：zhangsan"
                  />
                </div>
                {!editingUser && (
                  <div className="space-y-1.5">
                    <Label>初始密码</Label>
                    <Input
                      type="password"
                      value={form.password || ""}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="******"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>真实姓名</Label>
                  <Input
                    value={form.realName || ""}
                    onChange={(e) => setForm({ ...form, realName: e.target.value })}
                    placeholder="例如：张三"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>手机号</Label>
                  <Input
                    value={form.phone || ""}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="13800138000"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>邮箱</Label>
                <Input
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="zhangsan@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>系统默认角色</Label>
                  <Select
                    value={(form.role as string) || "tenant_user"}
                    onValueChange={(v) => setForm({ ...form, role: v as string })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择默认角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant_admin">企业管理员</SelectItem>
                      <SelectItem value="tenant_user">普通用户</SelectItem>
                      <SelectItem value="auditor">审计员（只读）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>账号状态</Label>
                  <Select
                    value={(form.status as string) || "active"}
                    onValueChange={(v) => setForm({ ...form, status: v as string })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">正常</SelectItem>
                      <SelectItem value="inactive">已停用</SelectItem>
                      <SelectItem value="locked">已锁定</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>分配自定义角色（可多选）</Label>
                <div className="border rounded-lg p-3 space-y-2">
                  {roles.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      暂无自定义角色，请先前往角色管理页面创建。
                    </div>
                  )}
                  {roles.map((r) => (
                    <div key={r.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`role-${r.id}`}
                        checked={selectedRoles.includes(r.id)}
                        onCheckedChange={() => toggleRole(r.id)}
                      />
                      <label htmlFor={`role-${r.id}`} className="text-sm cursor-pointer">
                        {r.roleName}
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
                  {editingUser ? "保存变更" : "确认创建"}
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
              <Input placeholder="搜索用户名/姓名/手机号" className="pl-9 h-9" />
            </div>
            <Button variant="outline" size="sm" className="h-9">
              全部角色
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              全部状态
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
                  <th className="text-left px-3 py-2 font-medium">用户信息</th>
                  <th className="text-left px-3 py-2 font-medium">系统角色</th>
                  <th className="text-left px-3 py-2 font-medium">自定义角色</th>
                  <th className="text-left px-3 py-2 font-medium">最后登录</th>
                  <th className="text-left px-3 py-2 font-medium">状态</th>
                  <th className="text-left px-3 py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                          {(u.realName || u.username)[0]}
                        </div>
                        <div>
                          <div className="font-medium">{u.realName || u.username}</div>
                          <div className="text-xs text-muted-foreground">{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {u.role === "tenant_admin" ? (
                          <Shield className="w-3.5 h-3.5 text-cyan-600" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                        <span>
                          {u.role === "tenant_admin"
                            ? "企业管理员"
                            : u.role === "auditor"
                            ? "审计员"
                            : "普通用户"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.userRoles.length === 0 && (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                        {u.userRoles.map((ur) => (
                          <Badge key={ur.roleId} variant="secondary" className="text-xs font-normal">
                            {ur.role.roleName}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleString("zh-CN")
                        : "从未登录"}
                    </td>
                    <td className="px-3 py-3">
                      {u.status === "active" ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">正常</Badge>
                      ) : u.status === "inactive" ? (
                        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">已停用</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">已锁定</Badge>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-7 text-cyan-600">
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          详情
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-cyan-600" onClick={() => startEdit(u)}>
                          <Pencil className="w-3.5 h-3.5 mr-1" />
                          编辑
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
