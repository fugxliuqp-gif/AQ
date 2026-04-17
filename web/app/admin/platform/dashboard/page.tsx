"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Building2,
  Users,
  KeyRound,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const stats = [
  {
    title: "租户总数",
    value: "42",
    change: "+3",
    trend: "up",
    desc: "本月新增",
    icon: Building2,
  },
  {
    title: "平台活跃用户",
    value: "1,284",
    change: "+12%",
    trend: "up",
    desc: "较上月",
    icon: Users,
  },
  {
    title: "已开通模块",
    value: "186",
    change: "+8",
    trend: "up",
    desc: "本月新增授权",
    icon: KeyRound,
  },
  {
    title: "30天内到期租户",
    value: "5",
    change: "2",
    trend: "down",
    desc: "需续费提醒",
    icon: AlertTriangle,
  },
];

const recentTenants = [
  { name: "江苏恒泰化工", plan: "pro", expire: "2025-12-31", users: 86, status: "active" },
  { name: "南京金陵石化", plan: "enterprise", expire: "2026-03-15", users: 342, status: "active" },
  { name: "连云港盛虹炼化", plan: "basic", expire: "2025-05-10", users: 24, status: "warning" },
  { name: "扬子巴斯夫", plan: "enterprise", expire: "2026-01-20", users: 518, status: "active" },
];

const moduleDistribution = [
  { name: "EHS安全管理", count: 38, color: "bg-cyan-500" },
  { name: "设备管理", count: 35, color: "bg-blue-500" },
  { name: "AI智能助手", count: 29, color: "bg-purple-500" },
  { name: "语音报隐患", count: 26, color: "bg-orange-500" },
  { name: "生产执行", count: 18, color: "bg-green-500" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">平台运营看板</h1>
        <p className="text-sm text-muted-foreground">实时监控租户状态、模块授权与平台健康度</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{s.title}</div>
                  <div className="text-3xl font-bold mt-1">{s.value}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <s.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span
                  className={cn(
                    "flex items-center gap-0.5 font-medium",
                    s.trend === "up" ? "text-green-600" : "text-orange-600"
                  )}
                >
                  {s.trend === "up" ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {s.change}
                </span>
                <span className="text-muted-foreground">{s.desc}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 最近新增租户 */}
        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">最近新增 / 活跃租户</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">企业名称</th>
                  <th className="text-left px-3 py-2 font-medium">套餐</th>
                  <th className="text-left px-3 py-2 font-medium">到期日</th>
                  <th className="text-left px-3 py-2 font-medium">用户数</th>
                  <th className="text-left px-3 py-2 font-medium">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentTenants.map((t) => (
                  <tr key={t.name} className="hover:bg-gray-50">
                    <td className="px-3 py-3 font-medium">{t.name}</td>
                    <td className="px-3 py-3">
                      <Badge variant="outline" className="capitalize">
                        {t.plan}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{t.expire}</td>
                    <td className="px-3 py-3">{t.users} 人</td>
                    <td className="px-3 py-3">
                      {t.status === "active" ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">正常</Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">即将到期</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* 模块开通分布 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">模块开通分布</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {moduleDistribution.map((m) => (
              <div key={m.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{m.name}</span>
                  <span className="font-medium">{m.count} 家</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", m.color)}
                    style={{ width: `${(m.count / 42) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 text-center hover:border-cyan-500 cursor-pointer transition">
          <div className="text-cyan-600 font-medium">+ 新建租户</div>
          <div className="text-xs text-muted-foreground mt-1">配置有效期与初始模块</div>
        </Card>
        <Card className="p-4 text-center hover:border-cyan-500 cursor-pointer transition">
          <div className="text-cyan-600 font-medium">批量续期</div>
          <div className="text-xs text-muted-foreground mt-1">为到期租户批量延长服务</div>
        </Card>
        <Card className="p-4 text-center hover:border-cyan-500 cursor-pointer transition">
          <div className="text-cyan-600 font-medium">发送续费提醒</div>
          <div className="text-xs text-muted-foreground mt-1">向 5 个即将到期租户发送邮件</div>
        </Card>
        <Card className="p-4 text-center hover:border-cyan-500 cursor-pointer transition">
          <div className="text-cyan-600 font-medium">查看操作审计</div>
          <div className="text-xs text-muted-foreground mt-1">平台管理员关键操作记录</div>
        </Card>
      </div>
    </div>
  );
}


