"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Activity, CheckCircle2 } from "lucide-react";

export default function MobileHazardPage() {
  const [recording, setRecording] = useState(false);

  return (
    <div className="flex h-full items-center justify-center bg-gray-900 p-6">
      {/* 手机外框 */}
      <div className="w-[375px] h-[812px] bg-white rounded-[40px] shadow-2xl overflow-hidden relative border-8 border-gray-800">
        {/* 手机状态栏 */}
        <div className="h-12 bg-cyan-600 flex items-center justify-between px-6 text-white text-xs">
          <span>9:41</span>
          <div className="flex gap-1">
            <i className="fa-solid fa-signal" />
            <i className="fa-solid fa-wifi" />
            <i className="fa-solid fa-battery-full" />
          </div>
        </div>

        {/* 页面内容 */}
        <div className="flex flex-col h-[calc(100%-3rem)] bg-gray-50">
          {/* 顶部 */}
          <div className="bg-cyan-600 text-white px-5 py-4">
            <div className="text-lg font-bold">语音报隐患</div>
            <div className="text-xs opacity-90">三车间 · 操作工 · 张工</div>
          </div>

          {/* 语音交互区 */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
            <div className="text-center space-y-2">
              <div className="text-gray-500 text-sm">按住下方按钮，描述发现的隐患</div>
              <div className="text-xs text-gray-400">
                例如：&quot;三号泵轴承有异常声响，温度偏高&quot;
              </div>
            </div>

            {/* 大语音按钮 */}
            <div className="relative">
              {recording && (
                <>
                  <div className="absolute inset-0 rounded-full bg-cyan-400 opacity-40 animate-ping" />
                  <div
                    className="absolute inset-0 rounded-full bg-cyan-400 opacity-40 animate-ping"
                    style={{ animationDelay: "1s" }}
                  />
                </>
              )}
              <button
                onMouseDown={() => setRecording(true)}
                onMouseUp={() => setRecording(false)}
                onTouchStart={() => setRecording(true)}
                onTouchEnd={() => setRecording(false)}
                className="relative w-28 h-28 rounded-full bg-cyan-600 text-white shadow-xl flex items-center justify-center text-4xl active:scale-95 transition"
              >
                <Mic className="w-10 h-10" />
              </button>
            </div>

            {/* 识别中提示 */}
            <div
              className={`text-cyan-700 text-sm font-medium ${
                recording ? "animate-pulse" : "opacity-0"
              }`}
            >
              正在聆听...
            </div>
          </div>

          {/* 识别结果卡片 */}
          <Card className="bg-white border-t rounded-t-3xl p-5 shadow-lg border-0">
            <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
              <Activity className="w-4 h-4 text-cyan-600" />
              <span className="font-medium">识别结果</span>
            </div>
            <div className="text-sm text-gray-800 bg-gray-100 p-3 rounded-lg mb-3">
              &quot;三号泵轴承有异响，外壳温度大概六十多度，比以前高。&quot;
            </div>
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">关联设备</span>
                <span className="font-medium text-cyan-700">P-203 循环泵（三车间）</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">风险等级</span>
                <span className="font-medium text-orange-600">一般隐患</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">推荐措施</span>
                <span className="text-right text-gray-700 max-w-[60%]">
                  停机检查轴承润滑及对中情况
                </span>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 rounded-xl">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                确认上报
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl">
                重新描述
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* 说明文字 */}
      <div className="absolute bottom-6 text-gray-400 text-xs text-center w-full">
        桌面端模拟手机预览 · 实际以移动端 App 为准
      </div>
    </div>
  );
}
