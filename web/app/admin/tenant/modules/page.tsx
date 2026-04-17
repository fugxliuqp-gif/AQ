"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Users, Save, Info } from "lucide-react";

const users = [
  { id: 1, name: "张三 (zhangsan)", role: "tenant_user" },
  { id: 2, name: "李四 (lisi)", role: "tenant_user" },
  { id: 3, name: "王五 (wangwu)", role: "auditor" },
];

const modules = [
  {
    code: "ehs",
    name: "EHS安全管理",
    category: "安全",
    description: "隐患排查、作业票管理、变更管理",
    tenantLicensed: true,
  },
  {
    code: "equipment",
    name: "设备管理",
    category: "设备",
    description: "设备台账、检维修、特种设备",
    tenantLicensed: true,
  },
  {
    code: "mes",
    name: "生产执行",
    category: "生产",
    description: "生产调度、工艺管理、批次追踪",
    tenantLicensed: false,
  },
  {
    code: "ai_chat",
    name: "AI智能助手",
    category: "AI",
    description: "自然语言查询、智能问答、报表生成",
    tenantLicensed: true,
  },
  {
    code: "mobile_hazard",
    name: "语音报隐患",
    category: "安全",
    description: "移动端语音快速上报隐患",
    tenantLicensed: true,
  },
];

// 模拟每个用户的模块权限
const userPerms: Record<number, Record<string, boolean>> = {
  1: { ehs: true, equipment: true, ai_chat: true, mobile_hazard: false },
  2: { ehs: true, equipment: false, ai_chat: true, mobile_hazard: true },
  3: { ehs: true, equipment: true, ai_chat: false, mobile_hazard: false },
};

export default function TenantModulesPage() {
  const [selectedUser, setSelectedUser] = useState<string>(users[0].id.toString());
  const [perms, setPerms] = useState(userPerms);

  const currentUserId = parseInt(selectedUser, 10);

  const toggleModule = (moduleCode: string) => {
    const mod = modules.find((m) => m.code === moduleCode);
    if (!mod?.tenantLicensed) return;
    setPerms((prev) => ({
      ...prev,
      [currentUserId]: {
        ...prev[currentUserId],
        [moduleCode]: !prev[currentUserId][moduleCode],
      },
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">模块权限</h1>
          <p className="text-sm text-muted-foreground">
            在平台已授权的模块范围内，为每位用户分配可使用的功能模块
          </p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Save className="w-4 h-4 mr-1" />
          保存变更
        </Button>
      </div>

      <Card className="border-cyan-100 bg-cyan-50/30">
        <CardContent className="p-4 flex items-center gap-3">
          <Info className="w-5 h-5 text-cyan-600" />
          <div className="text-sm text-cyan-800">
            <span className="font-medium">权限说明：</span>
            灰色开关表示该模块未对企业开通，需联系平台管理员购买后方可分配给用户。
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-cyan-600" />
            <CardTitle className="text-base">选择用户</CardTitle>
            <Select value={selectedUser} onValueChange={(v) => v && setSelectedUser(v)}>
              <SelectTrigger className="w-64 ml-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id.toString()}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium w-48">
                  <div className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    模块
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-medium">企业授权状态</th>
                <th className="text-left px-4 py-3 font-medium">用户权限</th>
                <th className="text-left px-4 py-3 font-medium">说明</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {modules.map((mod) => {
                const licensed = mod.tenantLicensed;
                const granted = perms[currentUserId]?.[mod.code] || false;
                return (
                  <tr key={mod.code} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="font-medium">{mod.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {mod.category}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {licensed ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          已开通
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                          未开通
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <Switch
                        checked={granted}
                        disabled={!licensed}
                        onCheckedChange={() => toggleModule(mod.code)}
                      />
                    </td>
                    <td className="px-4 py-4 text-muted-foreground max-w-md">
                      {mod.description}
                      {!licensed && (
                        <span className="text-gray-400 ml-2">（需联系平台购买）</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
