"use server";

import { db } from "@/lib/db";
import { polls, pollDates, pollResponses, tripMembers, notifications } from "@/lib/schema";
import { requireAuth, requireTripMember, requireTripOwner } from "@/lib/auth-helpers";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createPoll(tripId: string, formData: FormData) {
  const user = await requireAuth();
  await requireTripMember(user.id, tripId);

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const dates = formData.getAll("dates") as string[];
  const notify = formData.get("notify") === "1";

  const [poll] = await db
    .insert(polls)
    .values({ tripId, title, description, createdBy: user.id })
    .returning();

  if (dates.length > 0) {
    await db.insert(pollDates).values(
      dates.map((date, i) => ({ pollId: poll.id, date, sortOrder: i }))
    );
  }

  if (notify) {
    const members = await db
      .select({ userId: tripMembers.userId })
      .from(tripMembers)
      .where(eq(tripMembers.tripId, tripId));
    const others = members.filter((m) => m.userId !== user.id);
    if (others.length > 0) {
      await db.insert(notifications).values(
        others.map((m) => ({
          userId: m.userId,
          type: "poll_created" as const,
          tripId,
          fromUserId: user.id,
          pollId: poll.id,
          read: false,
        }))
      );
    }
  }

  revalidatePath(`/trips/${tripId}/poll`);
}

export async function submitPollResponse(
  pollId: string,
  dateId: string,
  response: "ok" | "maybe" | "ng",
  tripId: string
) {
  const user = await requireAuth();
  await requireTripMember(user.id, tripId);

  const existing = await db
    .select()
    .from(pollResponses)
    .where(
      and(
        eq(pollResponses.dateId, dateId),
        eq(pollResponses.userId, user.id)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(pollResponses)
      .set({ response })
      .where(
        and(
          eq(pollResponses.dateId, dateId),
          eq(pollResponses.userId, user.id)
        )
      );
  } else {
    await db.insert(pollResponses).values({
      pollId,
      dateId,
      userId: user.id,
      response,
    });
  }

}

export async function completePollResponse(pollId: string, tripId: string) {
  const user = await requireAuth();
  await requireTripMember(user.id, tripId);

  const [member] = await db
    .select({ role: tripMembers.role })
    .from(tripMembers)
    .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, user.id)))
    .limit(1);

  if (member?.role === "owner") return;

  const [owner] = await db
    .select({ userId: tripMembers.userId })
    .from(tripMembers)
    .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.role, "owner")))
    .limit(1);

  if (!owner) return;

  const [alreadyNotified] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.fromUserId, user.id),
        eq(notifications.pollId, pollId)
      )
    )
    .limit(1);

  if (alreadyNotified) {
    await db.delete(notifications).where(eq(notifications.id, alreadyNotified.id));
  }
  await db.insert(notifications).values({
    userId: owner.userId,
    type: alreadyNotified ? "poll_updated" : "poll_answered",
    tripId,
    fromUserId: user.id,
    pollId,
    read: false,
  });
}

export async function updatePoll(
  pollId: string,
  tripId: string,
  formData: FormData
) {
  const user = await requireAuth();
  await requireTripOwner(user.id, tripId);

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const newDates = formData.getAll("dates") as string[];

  await db
    .update(polls)
    .set({ title, description })
    .where(eq(polls.id, pollId));

  const existingDates = await db
    .select()
    .from(pollDates)
    .where(eq(pollDates.pollId, pollId));

  const existingMap = new Map(existingDates.map((d) => [d.date, d]));
  const newSet = new Set(newDates);

  const toDelete = existingDates.filter((d) => !newSet.has(d.date));
  const toAdd = newDates.filter((d) => !existingMap.has(d));

  if (toDelete.length > 0) {
    for (const d of toDelete) {
      await db.delete(pollDates).where(eq(pollDates.id, d.id));
    }
  }
  if (toAdd.length > 0) {
    await db.insert(pollDates).values(
      toAdd.map((date, i) => ({
        pollId,
        date,
        sortOrder: existingDates.length + i,
      }))
    );
  }

  revalidatePath(`/trips/${tripId}/poll`);
}

export async function refreshPoll(tripId: string) {
  revalidatePath(`/trips/${tripId}/poll`);
}

export async function deletePoll(pollId: string, tripId: string) {
  const user = await requireAuth();
  await requireTripOwner(user.id, tripId);
  await db.delete(polls).where(eq(polls.id, pollId));
  revalidatePath(`/trips/${tripId}/poll`);
}
