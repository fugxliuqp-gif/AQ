"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Paperclip } from "lucide-react";

interface Message {
  role: "user" | "ai";
  content: string;
  type?: "text" | "chart";
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        "您好，我是您的化工智能助手。您可以问我数据、让我帮您创建单据，或总结报告。试试说：",
      type: "text",
    },
    {
      role: "user",
      content: "R-101 本周温度趋势怎么样？",
      type: "text",
    },
    {
      role: "ai",
      content:
        "R-101（反应釜）本周运行平稳，平均温度 158.3°C，波动范围 ±2.1°C。但 4月15日 02:15~02:38 出现异常低温（最低 142°C），持续 23 分钟，已自动关联当班操作记录。",
      type: "chart",
    },
  ]);

  const send = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: "user", content: input, type: "text" }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          content: "已收到您的询问，正在为您查询相关数据...",
          type: "text",
        },
      ]);
    }, 600);
  };

  return (
    <div className="flex h-full bg-gray-50 p-6">
      <div className="max-w-3xl w-full mx-auto flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden shadow-lg">
          {/* 头部 */}
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-sm">AI 化工助手</div>
                <div className="text-xs text-slate-300">
                  已接入 EHS / MES / 设备管理 / DCS
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-400">对话记录自动保存</div>
          </div>

          {/* 消息区 */}
          <div className="flex-1 overflow-auto p-6 space-y-4 bg-gray-50">
            {messages.map((msg, idx) =>
              msg.role === "user" ? (
                <div key={idx} className="flex justify-end">
                  <div className="bg-cyan-600 text-white rounded-xl rounded-tr-none px-4 py-3 max-w-[80%] text-sm shadow-sm">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div key={idx} className="flex gap-3">
                  <div className="w-8 h-8 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-sm shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="max-w-[85%] space-y-2">
                    <div className="bg-white border rounded-xl rounded-tl-none px-4 py-3 text-sm shadow-sm">
                      {msg.content}
                      {idx === 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="text-xs bg-cyan-50 text-cyan-700 px-2 py-1 rounded cursor-pointer hover:bg-cyan-100">
                            &quot;R-101本周温度趋势&quot;
                          </span>
                          <span className="text-xs bg-cyan-50 text-cyan-700 px-2 py-1 rounded cursor-pointer hover:bg-cyan-100">
                            &quot;帮我查张三的特种作业证&quot;
                          </span>
                          <span className="text-xs bg-cyan-50 text-cyan-700 px-2 py-1 rounded cursor-pointer hover:bg-cyan-100">
                            &quot;生成一份动火作业票&quot;
                          </span>
                        </div>
                      )}
                    </div>
                    {msg.type === "chart" && (
                      <div className="bg-white border rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-muted-foreground mb-2">
                          R-101 本周温度曲线（°C）
                        </div>
                        <div className="h-24 flex items-end gap-1">
                          {[60, 65, 62, 70, 68, 64, 35, 66].map((h, i) => (
                            <div
                              key={i}
                              className={`flex-1 rounded-t ${
                                i === 6 ? "bg-orange-400" : "bg-cyan-200"
                              }`}
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                          <span>周一</span>
                          <span>周二</span>
                          <span>周三</span>
                          <span>周四</span>
                          <span>周五</span>
                          <span>周六</span>
                          <span className="text-orange-600 font-medium">
                            周日↓
                          </span>
                          <span>今天</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8"
                          >
                            查看详细报表
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8"
                          >
                            导出 Excel
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8"
                          >
                            生成异常分析
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          {/* 输入框 */}
          <div className="border-t bg-white p-4">
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="outline"
                className="rounded-full shrink-0"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="输入问题或指令..."
                className="rounded-full bg-gray-100 border-0 focus-visible:ring-cyan-500"
              />
              <Button
                size="icon"
                onClick={send}
                className="rounded-full bg-cyan-600 hover:bg-cyan-700 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-center text-[10px] text-muted-foreground mt-2">
              AI 生成内容仅供参考，关键操作请以系统确认为准
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
