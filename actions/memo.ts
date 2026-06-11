"use server";

import { db } from "@/lib/db";
import { memos } from "@/lib/schema";
import { requireAuth, requireTripMember } from "@/lib/auth-helpers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function revalidateBoth(tripId: string) {
  revalidatePath(`/trips/${tripId}/memo`);
  revalidatePath(`/trips/${tripId}/plan`);
}

export async function createMemo(tripId: string, formData: FormData) {
  const user = await requireAuth();
  await requireTripMember(user.id, tripId);

  const title = formData.get("title") as string;
  const content = (formData.get("content") as string) || "";
  const activityId = (formData.get("activityId") as string) || null;

  await db.insert(memos).values({ tripId, title, content, createdBy: user.id, activityId });
  revalidateBoth(tripId);
}

export async function updateMemo(id: string, tripId: string, formData: FormData) {
  const user = await requireAuth();
  await requireTripMember(user.id, tripId);

  await db
    .update(memos)
    .set({
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      updatedAt: new Date(),
    })
    .where(eq(memos.id, id));

  revalidateBoth(tripId);
}

export async function deleteMemo(id: string, tripId: string) {
  const user = await requireAuth();
  await requireTripMember(user.id, tripId);
  await db.delete(memos).where(eq(memos.id, id));
  revalidateBoth(tripId);
}

export async function linkMemoToActivity(memoId: string, activityId: string, tripId: string) {
  const user = await requireAuth();
  await requireTripMember(user.id, tripId);
  await db.update(memos).set({ activityId }).where(eq(memos.id, memoId));
  revalidateBoth(tripId);
}

export async function unlinkMemoFromActivity(memoId: string, tripId: string) {
  const user = await requireAuth();
  await requireTripMember(user.id, tripId);
  await db.update(memos).set({ activityId: null }).where(eq(memos.id, memoId));
  revalidateBoth(tripId);
}
