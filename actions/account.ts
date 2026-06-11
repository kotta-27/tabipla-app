"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { signOut } from "@/auth";

export async function updateProfile(formData: FormData) {
  const user = await requireAuth();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "名前を入力してください" };

  await db.update(users).set({ name }).where(eq(users.id, user.id));
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const user = await requireAuth();
  const currentPassword = formData.get("current_password") as string;
  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "すべての項目を入力してください" };
  }
  if (newPassword.length < 6) {
    return { error: "新しいパスワードは6文字以上にしてください" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "パスワードが一致しません" };
  }

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!dbUser?.password) return { error: "パスワードが設定されていません" };

  const valid = await bcrypt.compare(currentPassword, dbUser.password);
  if (!valid) return { error: "現在のパスワードが正しくありません" };

  const hashed = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ password: hashed }).where(eq(users.id, user.id));
  return { success: true };
}

export async function updateAvatar(dataUrl: string) {
  const user = await requireAuth();
  if (!dataUrl.startsWith("data:image/")) return { error: "無効な画像形式です" };
  // ~500KB limit after base64
  if (dataUrl.length > 700 * 1024) return { error: "画像が大きすぎます" };

  await db.update(users).set({ image: dataUrl }).where(eq(users.id, user.id));
  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteAccount() {
  const user = await requireAuth();
  await db.delete(users).where(eq(users.id, user.id));
  await signOut({ redirectTo: "/login" });
}
