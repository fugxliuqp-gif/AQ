"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  MessageSquare,
  ClipboardCheck,
  TriangleAlert,
  Settings,
  LineChart,
  User,
  FlaskConical,
} from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "工作台" },
  { href: "/chat", icon: MessageSquare, label: "AI对话" },
  { href: "/equipment", icon: Settings, label: "设备台账" },
  { href: "/mobile-hazard", icon: TriangleAlert, label: "语音报隐患" },
  { href: "#", icon: ClipboardCheck, label: "巡检管理" },
  { href: "#", icon: LineChart, label: "数据报表" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-16 bg-slate-900 text-slate-300 flex flex-col items-center py-4 shrink-0">
      <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold mb-6">
        <FlaskConical className="w-5 h-5" />
      </div>
      <nav className="flex flex-col gap-6 flex-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-lg transition",
                active
                  ? "text-cyan-400 bg-slate-800"
                  : "hover:text-white hover:bg-slate-800"
              )}
            >
              <item.icon className="w-5 h-5" />
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-500 rounded-r" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <button className="flex items-center justify-center w-10 h-10 rounded-lg hover:text-white hover:bg-slate-800 transition">
          <User className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
