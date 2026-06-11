"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { signUp } from "@/actions/auth";
import { Spinner } from "@/components/ui/loading";
import { User, Mail, Lock } from "lucide-react";

export default function SignUpPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await signUp(formData);

    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-sky-200 via-sky-50 to-cyan-100 dark:from-sky-900 dark:via-gray-950 dark:to-slate-900 px-4 overflow-hidden">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src="/tabipla_icon_3.png" alt="" className="h-14 w-auto" />
          <img src="/tabipla_text_2.png" alt="tabipla" className="h-7 w-auto dark:hidden" />
          <img src="/tabipla_text_2_dark.png" alt="tabipla" className="h-7 w-auto hidden dark:block" />
          <p className="text-sm text-gray-500 dark:text-gray-400">みんなで作る旅行プランナー</p>
        </div>

        <div className="rounded-2xl border border-white/80 dark:border-sky-900/60 bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm p-8 shadow-lg shadow-sky-100/50 dark:shadow-sky-950/50">
          <h2 className="mb-6 text-lg font-semibold text-gray-800 dark:text-gray-100">アカウント作成</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
            <div className="space-y-1.5">
              <Label htmlFor="name">名前</Label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="山田 太郎"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">メールアドレス</Label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">パスワード</Label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="6文字以上"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>
            <Button type="submit" className="w-full gap-2 mt-2" disabled={pending}>
              {pending ? <><Spinner className="h-4 w-4" />登録中...</> : "アカウントを作成"}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-sky-600 hover:underline font-medium">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
