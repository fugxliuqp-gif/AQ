"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  KeyRound,
  Calendar,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

export default function TenantDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">企业概览</h1>
        <p className="text-sm text-muted-foreground">
          查看企业订阅状态、已开通模块及使用情况
        </p>
      </div>

      {/* 企业信息卡片 */}
      <Card className="border-cyan-200 bg-cyan-50/30">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-cyan-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <div className="text-lg font-bold">江苏恒泰化工有限公司</div>
                <div className="text-sm text-muted-foreground">
                  租户编码：HT-CHEM-001 · 套餐：Pro
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    服务正常
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    到期日：2025-12-31（剩 258 天）
                  </span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              联系平台升级
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">已用/总用户数</div>
                <div className="text-2xl font-bold">86 / 100</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">已开通模块</div>
                <div className="text-2xl font-bold">4 个</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">本月登录人次</div>
                <div className="text-2xl font-bold">1,245</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">活跃用户占比</div>
                <div className="text-2xl font-bold">78%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 已开通模块 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">已开通模块</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "EHS安全管理", expire: "2025-12-31", users: 50 },
              { name: "设备管理", expire: "2025-12-31", users: 30 },
              { name: "AI智能助手", expire: "2025-12-31", users: 86 },
              { name: "语音报隐患", expire: "2025-12-31", users: 60 },
            ].map((m) => (
              <div
                key={m.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-sm">{m.name}</div>
                  <div className="text-xs text-muted-foreground">
                    有效期至 {m.expire}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {m.users} 人使用
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 配额与提醒 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">配额与提醒</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>用户配额</span>
                <span className="font-medium">86 / 100</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: "86%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>存储空间</span>
                <span className="font-medium">32 / 50 GB</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "64%" }} />
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
              <div className="text-sm text-orange-700">
                <span className="font-medium">提醒：</span>
                用户配额即将用完（86/100），如需添加更多用户，请联系平台升级套餐。
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
