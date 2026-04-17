"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  KeyRound,
  Shield,
  Building2,
  Settings,
  LogOut,
  ArrowLeft,
} from "lucide-react";

const navItems = [
  { href: "/admin/tenant/dashboard", icon: LayoutDashboard, label: "企业概览" },
  { href: "/admin/tenant/users", icon: Users, label: "用户管理" },
  { href: "/admin/tenant/roles", icon: Shield, label: "角色管理" },
  { href: "/admin/tenant/modules", icon: KeyRound, label: "模块权限" },
  { href: "#", icon: Building2, label: "组织架构" },
  { href: "#", icon: Settings, label: "企业设置" },
];

export default function AdminTenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧导航 */}
      <aside className="w-56 bg-white border-r flex flex-col shrink-0">
        <div className="p-4 border-b">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="w-4 h-4" />
            返回工作台
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              企
            </div>
            <div>
              <div className="font-bold text-sm">企业管理后台</div>
              <div className="text-[10px] text-muted-foreground">Tenant Admin</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                  active
                    ? "bg-cyan-50 text-cyan-700 font-medium"
                    : "text-slate-600 hover:bg-gray-100 hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <button className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-foreground transition w-full">
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </aside>

      {/* 主内容 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
