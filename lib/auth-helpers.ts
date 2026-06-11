import { auth } from "@/auth";
import { db } from "./db";
import { tripMembers } from "./schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

export async function requireTripMember(userId: string, tripId: string) {
  const [member] = await db
    .select()
    .from(tripMembers)
    .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId)))
    .limit(1);
  if (!member) throw new Error("Unauthorized");
  return member;
}

export async function requireTripOwner(userId: string, tripId: string) {
  const member = await requireTripMember(userId, tripId);
  if (member.role !== "owner") throw new Error("Forbidden");
  return member;
}
