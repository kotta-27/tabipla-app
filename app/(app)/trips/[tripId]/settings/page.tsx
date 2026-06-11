import { auth } from "@/auth";
import { db } from "@/lib/db";
import { trips, tripMembers, users } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { TripSettingsForm } from "@/components/trip/TripSettingsForm";

export default async function TripSettingsPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const [[trip], members, [currentMember]] = await Promise.all([
    db.select().from(trips).where(eq(trips.id, tripId)).limit(1),
    db
      .select({ userId: tripMembers.userId, role: tripMembers.role, name: users.name, image: users.image })
      .from(tripMembers)
      .innerJoin(users, eq(tripMembers.userId, users.id))
      .where(eq(tripMembers.tripId, tripId)),
    db
      .select({ role: tripMembers.role })
      .from(tripMembers)
      .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, session.user.id)))
      .limit(1),
  ]);

  if (!trip || !currentMember) notFound();

  const sorted = [...members].sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">設定</h2>
      <TripSettingsForm
        tripId={tripId}
        initialName={trip.name}
        initialDestination={trip.destination}
        initialEmoji={trip.coverEmoji}
        members={sorted}
        currentUserId={session.user.id}
        isOwner={currentMember.role === "owner"}
      />
    </div>
  );
}
