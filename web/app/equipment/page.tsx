"use client";


import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Lightbulb, Send } from "lucide-react";

const equipmentData = [
  {
    code: "R-101",
    name: "加氢反应釜",
    dept: "三车间",
    status: "运行中",
    statusColor: "bg-green-100 text-green-700",
    nextCheck: "2025-08-15",
  },
  {
    code: "P-203",
    name: "循环泵",
    dept: "三车间",
    status: "待检修",
    statusColor: "bg-yellow-100 text-yellow-700",
    nextCheck: "2025-04-20（剩3天）",
    highlight: true,
  },
  {
    code: "T-501",
    name: "甲醇储罐",
    dept: "储运车间",
    status: "运行中",
    statusColor: "bg-green-100 text-green-700",
    nextCheck: "2025-06-10",
  },
];

export default function EquipmentPage() {
  return (
    <div className="flex h-full">
      {/* 传统左侧导航 */}
      <aside className="w-56 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-4 font-bold text-white border-b border-slate-700">
          EHS管理系统
        </div>
        <div className="flex-1 overflow-auto py-2">
          <div className="px-4 py-2 text-xs text-slate-500 uppercase">
            设备管理
          </div>
          <div className="px-6 py-2 bg-slate-800 text-white border-l-4 border-cyan-500">
            设备台账
          </div>
          <div className="px-6 py-2 hover:bg-slate-800 cursor-pointer">
            检维修管理
          </div>
          <div className="px-6 py-2 hover:bg-slate-800 cursor-pointer">
            特种设备
          </div>
          <div className="px-4 py-2 text-xs text-slate-500 uppercase mt-2">
            安全管理
          </div>
          <div className="px-6 py-2 hover:bg-slate-800 cursor-pointer">
            隐患排查
          </div>
          <div className="px-6 py-2 hover:bg-slate-800 cursor-pointer">
            作业票管理
          </div>
          <div className="px-6 py-2 hover:bg-slate-800 cursor-pointer">
            变更管理
          </div>
        </div>
      </aside>

      {/* 传统主内容 */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* 传统顶部栏 */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="text-lg font-semibold">设备台账</div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="搜索设备编号/名称"
              className="w-64 h-9"
            />
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
              + 新增设备
            </Button>
          </div>
        </div>

        {/* 传统表格 */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left">设备编号</th>
                  <th className="px-4 py-2 text-left">设备名称</th>
                  <th className="px-4 py-2 text-left">所在车间</th>
                  <th className="px-4 py-2 text-left">运行状态</th>
                  <th className="px-4 py-2 text-left">下次检验日期</th>
                  <th className="px-4 py-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {equipmentData.map((row) => (
                  <tr key={row.code} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{row.code}</td>
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3">{row.dept}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={`${row.statusColor} text-xs`}
                      >
                        {row.status}
                      </Badge>
                    </td>
                    <td
                      className={`px-4 py-3 ${
                        row.highlight ? "text-red-600 font-medium" : ""
                      }`}
                    >
                      {row.nextCheck}
                    </td>
                    <td className="px-4 py-3 text-cyan-600 cursor-pointer hover:underline">
                      详情
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 右侧AI协作者（Sidecar） */}
      <aside className="w-80 bg-white border-l flex flex-col shadow-xl shrink-0">
        <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50">
          <div className="font-semibold text-sm flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-600" />
            AI 助手
          </div>
          <div className="text-xs text-muted-foreground">当前页面：设备台账</div>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3 text-sm">
          <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-3">
            <div className="font-medium text-cyan-800 mb-1 flex items-center gap-1">
              <Lightbulb className="w-4 h-4" />
              页面洞察
            </div>
            <div className="text-cyan-700 text-xs leading-relaxed">
              本页共 <strong>312</strong> 台设备，其中 <strong>2 台</strong>{" "}
              处于异常/待检修状态。P-203 循环泵距下次检验仅剩{" "}
              <strong>3 天</strong>，建议尽快安排定检计划。
            </div>
          </div>

          <div className="border rounded-lg p-3">
            <div className="font-medium text-gray-700 mb-2">快捷操作</div>
            <div className="space-y-2">
              <button className="w-full text-left text-xs bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded transition">
                🔍 找出本月到期的特种设备
              </button>
              <button className="w-full text-left text-xs bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded transition">
                📊 生成三车间设备完好率报表
              </button>
              <button className="w-full text-left text-xs bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded transition">
                ⚠️ 查看R-101历史异常记录
              </button>
            </div>
          </div>

          <div className="border rounded-lg p-3">
            <div className="font-medium text-gray-700 mb-2">对话</div>
            <div className="space-y-2 text-xs">
              <div className="bg-gray-100 rounded-lg px-3 py-2">
                帮我筛选出运行超过10年的压力容器
              </div>
              <div className="bg-cyan-50 rounded-lg px-3 py-2 border border-cyan-100">
                已为您筛选出 <strong>17 台</strong>{" "}
                运行超过10年的压力容器。oldest 的一台是 R-008（2008年投用），建议重点关注其腐蚀检测数据。
              </div>
            </div>
          </div>
        </div>
        <div className="border-t p-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="问AI..."
              className="text-xs h-9 focus-visible:ring-cyan-500"
            />
            <Button size="icon" className="h-9 w-9 bg-cyan-600 hover:bg-cyan-700">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
