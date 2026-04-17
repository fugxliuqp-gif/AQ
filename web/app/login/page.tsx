"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setToken } from "@/lib/auth";
import { api } from "@/lib/api";
import { FlaskConical, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      const { access_token, user } = res as { access_token: string; user: { role: string } };
      setToken(access_token);
      if (user.role === "super_admin") {
        router.push("/admin/platform/dashboard");
      } else {
        router.push("/admin/tenant/dashboard");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center text-white mb-4">
            <FlaskConical className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl">安全生产 Agent 平台</CardTitle>
          <p className="text-sm text-muted-foreground">请登录以继续使用</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-700"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              登录
            </Button>
          </form>
          <div className="mt-4 text-xs text-muted-foreground text-center">
            测试账号：superadmin / admin123
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
