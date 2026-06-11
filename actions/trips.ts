"use server";

import { db } from "@/lib/db";
import { trips, tripMembers, tripInvites, notifications, pollResponses, pollDates, polls } from "@/lib/schema";
import { requireAuth, requireTripMember } from "@/lib/auth-helpers";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTrip(formData: FormData): Promise<{ tripId: string }> {
  const user = await requireAuth();

  const name = formData.get("name") as string;
  const destination = (formData.get("destination") as string) || null;
  const coverEmoji = (formData.get("cover_emoji") as string) || "✈️";

  const [trip] = await db
    .insert(trips)
    .values({ name, destination, coverEmoji, createdBy: user.id })
    .returning();

  await db.insert(tripMembers).values({
    tripId: trip.id,
    userId: user.id,
    role: "owner",
  });

  revalidatePath("/dashboard");
  // redirect はクライアント側で行うため tripId を返す
  return { tripId: trip.id };
}

export async function joinTripByToken(token: string): Promise<{ tripId: string } | { error: string }> {
  const user = await requireAuth();

  const [invite] = await db
    .select()
    .from(tripInvites)
    .where(eq(tripInvites.token, token))
    .limit(1);

  if (!invite) return { error: "無効な招待リンクです" };

  // 既にメンバーなら何もしない
  const [existing] = await db
    .select()
    .from(tripMembers)
    .where(
      and(
        eq(tripMembers.tripId, invite.tripId),
        eq(tripMembers.userId, user.id)
      )
    )
    .limit(1);

  if (!existing) {
    await db.insert(tripMembers).values({
      tripId: invite.tripId,
      userId: user.id,
      role: "member",
    });
  }

  revalidatePath("/dashboard");
  redirect(`/trips/${invite.tripId}/poll`);
}

export async function joinTripByUrl(input: string): Promise<{ tripId?: string; error?: string }> {
  const user = await requireAuth();

  // URL・コード（ダッシュ区切り可）どちらでも受け付ける
  let token = input.trim();
  const match = token.match(/\/join\/([^/?#]+)/);
  if (match) token = match[1];
  token = token.replace(/-/g, "").toLowerCase();

  if (!token) return { error: "招待コードを入力してください" };

  const [invite] = await db
    .select()
    .from(tripInvites)
    .where(eq(tripInvites.token, token))
    .limit(1);

  if (!invite) return { error: "無効な招待リンクです" };

  const [existing] = await db
    .select()
    .from(tripMembers)
    .where(and(eq(tripMembers.tripId, invite.tripId), eq(tripMembers.userId, user.id)))
    .limit(1);

  if (!existing) {
    await db.insert(tripMembers).values({ tripId: invite.tripId, userId: user.id, role: "member" });

    // オーナー全員に「参加しました」通知を送る
    const owners = await db
      .select({ userId: tripMembers.userId })
      .from(tripMembers)
      .where(and(eq(tripMembers.tripId, invite.tripId), eq(tripMembers.role, "owner")));

    if (owners.length > 0) {
      await db.insert(notifications).values(
        owners.map((o) => ({
          userId: o.userId,
          type: "joined" as const,
          tripId: invite.tripId,
          fromUserId: user.id,
          read: false,
        }))
      );
    }

    revalidatePath("/dashboard");
  }

  return { tripId: invite.tripId };
}

export async function createInviteToken(tripId: string): Promise<{ token: string }> {
  const user = await requireAuth();
  await requireTripMember(user.id, tripId);

  const [existing] = await db
    .select()
    .from(tripInvites)
    .where(
      and(
        eq(tripInvites.tripId, tripId),
        eq(tripInvites.createdBy, user.id)
      )
    )
    .limit(1);

  if (existing) return { token: existing.token };

  const [invite] = await db
    .insert(tripInvites)
    .values({ tripId, createdBy: user.id })
    .returning();

  return { token: invite.token };
}

export async function updateTrip(tripId: string, formData: FormData): Promise<{ ok: true }> {
  const user = await requireAuth();
  const member = await requireTripMember(user.id, tripId);
  if (member.role !== "owner") throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const destination = (formData.get("destination") as string) || null;
  const coverEmoji = formData.get("cover_emoji") as string;

  await db.update(trips).set({ name, destination, coverEmoji }).where(eq(trips.id, tripId));
  revalidatePath(`/trips/${tripId}/settings`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteTrip(tripId: string) {
  const user = await requireAuth();
  const member = await requireTripMember(user.id, tripId);
  if (member.role !== "owner") throw new Error("Unauthorized");

  await db.delete(trips).where(eq(trips.id, tripId));
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function leaveTrip(tripId: string) {
  const user = await requireAuth();
  const member = await requireTripMember(user.id, tripId);
  if (member.role === "owner") throw new Error("オーナーは脱退できません");

  // トリップの全 pollDate ID を取得して回答を削除
  const tripPolls = await db.select({ id: polls.id }).from(polls).where(eq(polls.tripId, tripId));
  if (tripPolls.length > 0) {
    const pollIds = tripPolls.map((p) => p.id);
    const dates = await db.select({ id: pollDates.id }).from(pollDates).where(inArray(pollDates.pollId, pollIds));
    if (dates.length > 0) {
      await db.delete(pollResponses).where(
        and(inArray(pollResponses.dateId, dates.map((d) => d.id)), eq(pollResponses.userId, user.id))
      );
    }
  }

  await db.delete(tripMembers).where(
    and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, user.id))
  );

  const [owner] = await db
    .select({ userId: tripMembers.userId })
    .from(tripMembers)
    .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.role, "owner")))
    .limit(1);

  if (owner) {
    await db.insert(notifications).values({
      userId: owner.userId,
      type: "left",
      tripId,
      fromUserId: user.id,
      read: false,
    });
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function removeTripMember(tripId: string, targetUserId: string): Promise<{ ok: true }> {
  const user = await requireAuth();
  const member = await requireTripMember(user.id, tripId);
  if (member.role !== "owner") throw new Error("Unauthorized");

  const tripPolls = await db.select({ id: polls.id }).from(polls).where(eq(polls.tripId, tripId));
  if (tripPolls.length > 0) {
    const pollIds = tripPolls.map((p) => p.id);
    const dates = await db.select({ id: pollDates.id }).from(pollDates).where(inArray(pollDates.pollId, pollIds));
    if (dates.length > 0) {
      await db.delete(pollResponses).where(
        and(inArray(pollResponses.dateId, dates.map((d) => d.id)), eq(pollResponses.userId, targetUserId))
      );
    }
  }

  await db.delete(tripMembers).where(
    and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, targetUserId))
  );

  await db.insert(notifications).values({
    userId: targetUserId,
    type: "removed",
    tripId,
    fromUserId: user.id,
    read: false,
  });

  revalidatePath(`/trips/${tripId}/settings`);
  return { ok: true };
}

export async function sendTripInviteToUser(tripId: string, toUserId: string): Promise<{ ok: true } | { error: string }> {
  const user = await requireAuth();
  await requireTripMember(user.id, tripId);

  const [alreadyMember] = await db
    .select()
    .from(tripMembers)
    .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, toUserId)))
    .limit(1);

  if (alreadyMember) return { error: "すでにメンバーです" };

  const [existing] = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, toUserId),
        eq(notifications.tripId, tripId),
        eq(notifications.type, "trip_invite"),
        eq(notifications.read, false)
      )
    )
    .limit(1);

  if (existing) return { error: "すでに招待済みです" };

  await db.insert(notifications).values({
    userId: toUserId,
    type: "trip_invite",
    tripId,
    fromUserId: user.id,
    read: false,
  });

  return { ok: true };
}
