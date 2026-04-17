"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Package,
  Building2,
  DollarSign,
  MoreHorizontal,
} from "lucide-react";

const modules = [
  {
    code: "ehs",
    name: "EHS安全管理",
    category: "安全",
    description: "隐患排查、作业票管理、变更管理、安全培训",
    price: 2999.0,
    tenants: 38,
    status: "active",
  },
  {
    code: "equipment",
    name: "设备管理",
    category: "设备",
    description: "设备台账、检维修管理、特种设备、备品备件",
    price: 1999.0,
    tenants: 35,
    status: "active",
  },
  {
    code: "mes",
    name: "生产执行",
    category: "生产",
    description: "生产调度、工艺管理、批次追踪、质量检验",
    price: 4999.0,
    tenants: 18,
    status: "active",
  },
  {
    code: "ai_chat",
    name: "AI智能助手",
    category: "AI",
    description: "自然语言查询、智能问答、报表生成、数据洞察",
    price: 999.0,
    tenants: 29,
    status: "active",
  },
  {
    code: "mobile_hazard",
    name: "语音报隐患",
    category: "安全",
    description: "移动端语音快速上报隐患、AI自动识别与定级",
    price: 599.0,
    tenants: 26,
    status: "active",
  },
];

export default function ModulesPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">模块管理</h1>
          <p className="text-sm text-muted-foreground">
            管理平台可售卖的功能模块，配置定价与依赖关系
          </p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="w-4 h-4 mr-1" />
          新增模块
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="搜索模块名称/编码" className="pl-9 h-9" />
            </div>
            <Button variant="outline" size="sm" className="h-9">
              全部分类
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-3 py-2 font-medium">模块编码</th>
                <th className="text-left px-3 py-2 font-medium">模块名称</th>
                <th className="text-left px-3 py-2 font-medium">分类</th>
                <th className="text-left px-3 py-2 font-medium">描述</th>
                <th className="text-left px-3 py-2 font-medium">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    默认定价
                  </div>
                </th>
                <th className="text-left px-3 py-2 font-medium">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    开通租户
                  </div>
                </th>
                <th className="text-left px-3 py-2 font-medium">状态</th>
                <th className="text-left px-3 py-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {modules.map((m) => (
                <tr key={m.code} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-mono text-muted-foreground">
                    {m.code}
                  </td>
                  <td className="px-3 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-cyan-600" />
                      {m.name}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant="outline">{m.category}</Badge>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground max-w-xs truncate">
                    {m.description}
                  </td>
                  <td className="px-3 py-3">¥{m.price.toFixed(2)}/月</td>
                  <td className="px-3 py-3">{m.tenants} 家</td>
                  <td className="px-3 py-3">
                    {m.status === "active" ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        已上线
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                        已下线
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-7 text-cyan-600">
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
        </CardContent>
      </Card>
    </div>
  );
}
