import { auth } from "@/auth";
import { db } from "@/lib/db";
import { trips, tripMembers, users } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { MapPin } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { InviteButton } from "@/components/trip/InviteButton";
import { TripTabs } from "@/components/trip/TripTabs";
import { TripReadySignal } from "@/components/trip/TripReadySignal";
import { MemberAvatarGroup } from "@/components/trip/MemberAvatarGroup";

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const t0 = performance.now();

  const session = await auth();
  if (!session) redirect("/login");
  console.log(`[layout] auth: ${(performance.now() - t0).toFixed(0)}ms`);

  const t1 = performance.now();
  const [[trip], [member], members] = await Promise.all([
    db.select().from(trips).where(eq(trips.id, tripId)).limit(1),
    db.select().from(tripMembers).where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, session.user.id))).limit(1),
    db.select({ name: users.name, image: users.image, role: tripMembers.role })
      .from(tripMembers)
      .innerJoin(users, eq(tripMembers.userId, users.id))
      .where(eq(tripMembers.tripId, tripId)),
  ]);
  console.log(`[layout] trip+member fetch: ${(performance.now() - t1).toFixed(0)}ms`);
  console.log(`[layout] total: ${(performance.now() - t0).toFixed(0)}ms`);

  if (!trip) notFound();
  if (!member) redirect("/dashboard");

  return (
    <div className="space-y-4 pb-20 sm:pb-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl">{trip.coverEmoji}</span>
            <h1 className="text-md sm:text-2xl font-bold">{trip.name}</h1>
            <MemberAvatarGroup members={members} />
          </div>
          {trip.destination && (
            <p className="text-sm text-gray-500 mt-1 ml-1 flex items-center gap-1"><MapPin size={12} className="shrink-0" />{trip.destination}</p>
          )}
        </div>
        <div className="hidden sm:block">
          <InviteButton tripId={tripId} />
        </div>
      </div>

      <TripTabs tripId={tripId} />
      <TripReadySignal />

      <div>{children}</div>
    </div>
  );
}
