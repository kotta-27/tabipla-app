"use client";

import { useState, useTransition } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateProfile, updatePassword, updateAvatar, deleteAccount } from "@/actions/account";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/loading";
import { User, Mail, Lock, Camera, LogOut, Trash2, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

async function resizeToDataUrl(file: File, maxSize = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      const scale = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight, 1);
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("canvas error")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

export function AccountForm({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resizedDataUrl, setResizedDataUrl] = useState<string | null>(null);
  const [passwordFormKey, setPasswordFormKey] = useState(0);
  const [name, setName] = useState(user.name ?? "");

  const initials = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();
  const currentAvatar = previewUrl ?? user.image;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("画像ファイルを選択してください"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("ファイルサイズは10MB以下にしてください"); return; }
    setPreviewUrl(URL.createObjectURL(file));
    try {
      setResizedDataUrl(await resizeToDataUrl(file, 200));
    } catch {
      toast.error("画像の処理に失敗しました");
    }
  };

  const handleAvatarSave = () => {
    if (!resizedDataUrl) return;
    startTransition(async () => {
      const result = await updateAvatar(resizedDataUrl);
      if (result?.error) { toast.error(result.error); }
      else { toast.success("アバターを更新しました"); setResizedDataUrl(null); setPreviewUrl(null); }
    });
  };

  const handleProfileSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result?.error) { toast.error(result.error); }
      else { toast.success("プロフィールを更新しました"); }
    });
  };

  const handlePasswordSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await updatePassword(formData);
      if (result?.error) { toast.error(result.error); }
      else { toast.success("パスワードを変更しました"); setPasswordFormKey((k) => k + 1); }
    });
  };

  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: "light", label: "ライト", icon: Sun },
    { value: "dark", label: "ダーク", icon: Moon },
    { value: "system", label: "システム", icon: Monitor },
  ] as const;

  return (
    <div className="space-y-5">

      {/* Avatar */}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">プロフィール画像</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar size="lg" className="size-20 text-2xl">
              {currentAvatar && <AvatarImage src={currentAvatar} alt={user.name ?? ""} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow transition-colors">
              <Camera size={13} />
              <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
            </label>
          </div>
          <div className="space-y-2">
            {resizedDataUrl ? (
              <Button size="sm" onClick={handleAvatarSave} disabled={isPending} className="gap-1.5">
                {isPending ? <><Spinner className="h-3.5 w-3.5" /><span>保存中</span></> : "保存する"}
              </Button>
            ) : (
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Camera size={13} />
                  画像を変更
                </span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
              </label>
            )}
            <p className="text-xs text-gray-400">JPG・PNG・GIF（最大10MB）</p>
          </div>
        </div>
      </section>

      {/* Profile */}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">プロフィール</h2>
        <form action={handleProfileSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">表示名</Label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：田中 太郎"
                className="pl-9"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>メールアドレス</Label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <Input value={user.email ?? ""} disabled className="pl-9 opacity-60" />
            </div>
          </div>
          <div className="pt-1 flex justify-end">
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? <><Spinner className="h-4 w-4" /><span>保存中</span></> : "保存する"}
            </Button>
          </div>
        </form>
      </section>

      {/* Password */}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">パスワード変更</h2>
        <form key={passwordFormKey} action={handlePasswordSubmit} className="space-y-4">
          {(["current_password", "new_password", "confirm_password"] as const).map((fieldName, i) => (
            <div key={fieldName} className="space-y-1.5">
              <Label htmlFor={fieldName}>
                {i === 0 ? "現在のパスワード" : i === 1 ? "新しいパスワード" : "新しいパスワード（確認）"}
              </Label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <Input
                  id={fieldName}
                  name={fieldName}
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  required
                  minLength={i > 0 ? 6 : undefined}
                />
              </div>
            </div>
          ))}
          <div className="pt-1 flex justify-end">
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? <><Spinner className="h-4 w-4" /><span>変更中</span></> : "変更する"}
            </Button>
          </div>
        </form>
      </section>

      {/* 表示設定 */}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">表示設定</h2>
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 text-xs transition-colors ${
                theme === value
                  ? "bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-medium"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              } ${value !== "light" ? "border-l border-gray-200 dark:border-gray-700" : ""}`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Other */}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">その他</h2>
        <Button variant="outline" className="w-full gap-2" onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut size={15} />
          ログアウト
        </Button>
        <Button
          variant="ghost"
          className="w-full gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          onClick={() => setConfirmDeleteOpen(true)}
        >
          <Trash2 size={15} />
          アカウントを削除する
        </Button>
      </section>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>アカウントを削除しますか？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">すべてのデータが完全に削除されます。この操作は取り消せません。</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDeleteOpen(false)}>キャンセル</Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={isPending}
              onClick={() => {
                setConfirmDeleteOpen(false);
                startTransition(async () => { await deleteAccount(); });
              }}
            >
              削除する
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
