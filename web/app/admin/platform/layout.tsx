"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Package,
  KeyRound,
  Users,
  Settings,
  Shield,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/admin/platform/dashboard", icon: LayoutDashboard, label: "运营看板" },
  { href: "/admin/platform/tenants", icon: Building2, label: "租户管理" },
  { href: "/admin/platform/licenses", icon: KeyRound, label: "授权管理" },
  { href: "/admin/platform/modules", icon: Package, label: "模块管理" },
  { href: "#", icon: Users, label: "平台用户" },
  { href: "#", icon: Settings, label: "系统设置" },
];

export default function AdminPlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧导航 */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3 text-white">
            <div className="w-9 h-9 bg-cyan-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">平台管理后台</div>
              <div className="text-[10px] text-slate-400">Super Admin</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                  active
                    ? "bg-cyan-600 text-white"
                    : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 px-3 py-2 text-sm hover:text-white transition w-full">
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </aside>

      {/* 主内容 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部栏 */}
        <header className="h-14 bg-white border-b px-6 flex items-center justify-between shrink-0">
          <div className="text-sm text-muted-foreground">
            当前登录：<span className="font-medium text-foreground">超级管理员</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
              系统运行正常
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium">
              SA
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
