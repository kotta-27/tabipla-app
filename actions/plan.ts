"use server";

import { db } from "@/lib/db";
import { activities } from "@/lib/schema";
import { requireAuth, requireTripMember } from "@/lib/auth-helpers";
import { eq, and, desc, gt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function extractActivityFields(formData: FormData) {
  return {
    date: formData.get("date") as string,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    location: (formData.get("location") as string) || null,
    startTime: (formData.get("start_time") as string) || null,
    endTime: (formData.get("end_time") as string) || null,
  };
}

export async function createActivity(tripId: string, formData: FormData) {
  const user = await requireAuth();
  await requireTripMember(user.id, tripId);

  const { date, title, description, location, startTime, endTime } = extractActivityFields(formData);

  const [last] = await db
    .select({ sortOrder: activities.sortOrder })
    .from(activities)
    .where(and(eq(activities.tripId, tripId), eq(activities.date, date)))
    .orderBy(desc(activities.sortOrder))
    .limit(1);

  await db.insert(activities).values({
    tripId,
    date,
    title,
    description,
    location,
    startTime,
    endTime,
    sortOrder: (last?.sortOrder ?? -1) + 1,
  });

  revalidatePath(`/trips/${tripId}/plan`);
}

export async function createActivityAt(
  tripId: string,
  insertAfterSortOrder: number,
  formData: FormData
) {
  const user = await requireAuth();
  await requireTripMember(user.id, tripId);

  const { date, title, description, location, startTime, endTime } = extractActivityFields(formData);

  await db
    .update(activities)
    .set({ sortOrder: sql`${activities.sortOrder} + 1` })
    .where(
      and(
        eq(activities.tripId, tripId),
        eq(activities.date, date),
        gt(activities.sortOrder, insertAfterSortOrder)
      )
    );

  await db.insert(activities).values({
    tripId,
    date,
    title,
    description,
    location,
    startTime,
    endTime,
    sortOrder: insertAfterSortOrder + 1,
  });

  revalidatePath(`/trips/${tripId}/plan`);
}

export async function updateActivity(id: string, tripId: string, formData: FormData) {
  const user = await requireAuth();
  await requireTripMember(user.id, tripId);

  const { date, title, description, location, startTime, endTime } = extractActivityFields(formData);

  await db
    .update(activities)
    .set({ date, title, description, location, startTime, endTime })
    .where(and(eq(activities.id, id), eq(activities.tripId, tripId)));

  revalidatePath(`/trips/${tripId}/plan`);
}

export async function updateActivityNote(id: string, tripId: string, description: string | null) {
  const user = await requireAuth();
  await requireTripMember(user.id, tripId);
  await db
    .update(activities)
    .set({ description })
    .where(and(eq(activities.id, id), eq(activities.tripId, tripId)));
  revalidatePath(`/trips/${tripId}/plan`);
}

export async function deleteActivity(id: string, tripId: string) {
  const user = await requireAuth();
  await requireTripMember(user.id, tripId);
  await db.delete(activities).where(eq(activities.id, id));
  revalidatePath(`/trips/${tripId}/plan`);
}

export async function createDraftActivity(tripId: string, id: string, date: string) {
  const user = await requireAuth();
  await requireTripMember(user.id, tripId);

  const [last] = await db
    .select({ sortOrder: activities.sortOrder })
    .from(activities)
    .where(and(eq(activities.tripId, tripId), eq(activities.date, date)))
    .orderBy(desc(activities.sortOrder))
    .limit(1);

  await db.insert(activities).values({
    id,
    tripId,
    date,
    title: "",
    sortOrder: (last?.sortOrder ?? -1) + 1,
  });
  // revalidatePath は呼ばない → プランページに表示されない
}

export async function deleteDraftActivity(id: string, tripId: string) {
  const user = await requireAuth();
  await requireTripMember(user.id, tripId);
  await db.delete(activities).where(and(eq(activities.id, id), eq(activities.tripId, tripId)));
  revalidatePath(`/trips/${tripId}/memo`);
}
