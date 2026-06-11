"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/loading";
import { Mail, Lock } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setFormError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setFormError("メールアドレスまたはパスワードが正しくありません");
      setPending(false);
    } else {
      window.location.href = callbackUrl;
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-sky-200 via-sky-50 to-cyan-100 dark:from-sky-900 dark:via-gray-950 dark:to-slate-900 px-4 overflow-hidden">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src="/tabipla_icon_3.png" alt="" className="h-14 w-auto" />
          <img src="/tabipla_logo.svg" alt="tabipla" className="h-7 w-auto dark:hidden" />
          <img src="/tabipla_logo_dark.svg" alt="tabipla" className="h-7 w-auto hidden dark:block" />
          <p className="text-sm text-gray-500 dark:text-gray-400">みんなで作る旅行プランナー</p>
        </div>

        <div className="rounded-2xl border border-white/80 dark:border-sky-900/60 bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm p-8 shadow-lg shadow-sky-100/50 dark:shadow-sky-950/50">
          <h2 className="mb-6 text-lg font-semibold text-gray-800 dark:text-gray-100">ログイン</h2>

          {(error || formError) && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {formError || "ログインに失敗しました"}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>
            <Button type="submit" className="w-full gap-2 mt-2" disabled={pending}>
              {pending ? <><Spinner className="h-4 w-4" />ログイン中...</> : "ログイン"}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          アカウントをお持ちでない方は{" "}
          <Link href="/signup" className="text-sky-600 hover:underline font-medium">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
