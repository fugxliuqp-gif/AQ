"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Command,
  ListChecks,
  TriangleAlert,
  FileText,
  Mic,
  Ticket,
  SearchIcon,
  FileOutput,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 顶部搜索栏 */}
      <div className="bg-white border-b px-8 py-4">
        <div className="max-w-3xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="试试说：昨天三车间R-101温度趋势 / 帮我创建动火作业票 / 本周到期特种作业证"
            className="w-full pl-10 pr-16 py-3 bg-gray-100 border-0 focus-visible:ring-cyan-500"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground border px-2 py-1 rounded flex items-center gap-1">
            <Command className="w-3 h-3" />K
          </div>
        </div>
      </div>

      {/* 智能卡片流 */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">
            上午好，张工。今日为您关注：
          </h2>

          {/* 卡片1：待办聚合 */}
          <Card className="hover:shadow-md transition">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                    <ListChecks className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">今日待巡检任务 3 项</div>
                    <div className="text-sm text-muted-foreground">
                      R-101反应釜、P-203循环泵、T-501储罐
                    </div>
                  </div>
                </div>
                <Button variant="link" className="text-cyan-600">
                  一键开始巡检 →
                </Button>
              </div>
              <div className="mt-3 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded">
                <TriangleAlert className="inline w-4 h-4 mr-1" />
                AI 提醒：R-101 昨晚温度异常波动 23 分钟，建议重点关注轴承温度测点。
              </div>
            </CardContent>
          </Card>

          {/* 卡片2：异常预警 */}
          <Card className="hover:shadow-md transition">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                    <TriangleAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">
                      DCS 异常报警：三车间蒸汽压力低
                    </div>
                    <div className="text-sm text-muted-foreground">
                      发生时间：06:42 | 持续时间：8分钟 | 已自动关联锅炉工段
                    </div>
                  </div>
                </div>
                <Button variant="link" className="text-cyan-600">
                  查看处置建议 →
                </Button>
              </div>
              <div className="mt-3 flex gap-2">
                <Badge variant="secondary">历史同类异常：2次</Badge>
                <Badge variant="secondary">关联SOP：锅炉蒸汽调节规程-03</Badge>
              </div>
            </CardContent>
          </Card>

          {/* 卡片3：知识/报表 */}
          <Card className="hover:shadow-md transition">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">本月能耗简报已生成</div>
                    <div className="text-sm text-muted-foreground">
                      同比 +8.3%，主要增量来自锅炉工段
                    </div>
                  </div>
                </div>
                <Button variant="link" className="text-cyan-600">
                  查看详情 →
                </Button>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <span className="font-medium">AI 结论：</span>
                建议本周内排查锅炉燃烧器空燃比调节曲线，历史数据显示该问题可导致能耗上升
                5~12%。
              </div>
            </CardContent>
          </Card>

          {/* 快捷入口 */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <Link href="/mobile-hazard">
              <Card className="p-4 text-center hover:border-cyan-500 cursor-pointer transition">
                <div className="text-2xl text-cyan-600 mb-2 flex justify-center">
                  <Mic className="w-8 h-8" />
                </div>
                <div className="text-sm font-medium">语音报隐患</div>
              </Card>
            </Link>
            <Card className="p-4 text-center hover:border-cyan-500 cursor-pointer transition">
              <div className="text-2xl text-cyan-600 mb-2 flex justify-center">
                <Ticket className="w-8 h-8" />
              </div>
              <div className="text-sm font-medium">开作业票</div>
            </Card>
            <Link href="/equipment">
              <Card className="p-4 text-center hover:border-cyan-500 cursor-pointer transition">
                <div className="text-2xl text-cyan-600 mb-2 flex justify-center">
                  <SearchIcon className="w-8 h-8" />
                </div>
                <div className="text-sm font-medium">查设备台账</div>
              </Card>
            </Link>
            <Card className="p-4 text-center hover:border-cyan-500 cursor-pointer transition">
              <div className="text-2xl text-cyan-600 mb-2 flex justify-center">
                <FileOutput className="w-8 h-8" />
              </div>
              <div className="text-sm font-medium">生成交接班</div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
