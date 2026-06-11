"use server";

import { db } from "@/lib/db";
import { notifications, tripMembers, trips, users, polls } from "@/lib/schema";
import { requireAuth } from "@/lib/auth-helpers";
import { eq, and, inArray, notInArray, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
  const user = await requireAuth();
  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      read: notifications.read,
      createdAt: notifications.createdAt,
      tripId: notifications.tripId,
      tripName: trips.name,
      tripEmoji: trips.coverEmoji,
      fromUserId: notifications.fromUserId,
      fromUserName: users.name,
      fromUserImage: users.image,
      pollTitle: polls.title,
    })
    .from(notifications)
    .leftJoin(trips, eq(notifications.tripId, trips.id))
    .leftJoin(users, eq(notifications.fromUserId, users.id))
    .leftJoin(polls, eq(notifications.pollId, polls.id))
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt));

  return rows;
}

export async function acceptTripInvite(notificationId: string) {
  const user = await requireAuth();

  const [notif] = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, user.id)))
    .limit(1);

  if (!notif || notif.type !== "trip_invite" || !notif.tripId) return { error: "無効な通知です" };

  const [existing] = await db
    .select()
    .from(tripMembers)
    .where(and(eq(tripMembers.tripId, notif.tripId), eq(tripMembers.userId, user.id)))
    .limit(1);

  if (!existing) {
    await db.insert(tripMembers).values({ tripId: notif.tripId, userId: user.id, role: "member" });
  }

  await db.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId));

  // 招待した人に「参加しました」通知を送る
  if (notif.fromUserId) {
    await db.insert(notifications).values({
      userId: notif.fromUserId,
      type: "joined",
      tripId: notif.tripId,
      fromUserId: user.id,
      read: false,
    });
  }

  revalidatePath("/dashboard");
  return { tripId: notif.tripId };
}

export async function dismissNotification(notificationId: string) {
  const user = await requireAuth();

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, user.id)));
}

export async function getPastCoTravelers(tripId: string) {
  const user = await requireAuth();

  const myMemberships = await db
    .select({ tripId: tripMembers.tripId })
    .from(tripMembers)
    .where(eq(tripMembers.userId, user.id));

  const myTripIds = myMemberships.map((m) => m.tripId);
  if (myTripIds.length === 0) return [];

  const currentMembers = await db
    .select({ userId: tripMembers.userId })
    .from(tripMembers)
    .where(eq(tripMembers.tripId, tripId));

  const excludeIds = [...currentMembers.map((m) => m.userId), user.id];

  const coTravelers = await db
    .selectDistinct({ userId: users.id, name: users.name, image: users.image })
    .from(tripMembers)
    .innerJoin(users, eq(tripMembers.userId, users.id))
    .where(
      and(
        inArray(tripMembers.tripId, myTripIds),
        notInArray(tripMembers.userId, excludeIds)
      )
    );

  // 招待中かどうかチェック
  const pendingInvites = await db
    .select({ userId: notifications.userId })
    .from(notifications)
    .where(
      and(
        eq(notifications.tripId, tripId),
        eq(notifications.type, "trip_invite"),
        eq(notifications.read, false),
        inArray(notifications.userId, coTravelers.map((c) => c.userId))
      )
    );

  const pendingSet = new Set(pendingInvites.map((p) => p.userId));

  return coTravelers.map((c) => ({
    ...c,
    pendingInvite: pendingSet.has(c.userId),
  }));
}
