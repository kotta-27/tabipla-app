import { auth } from "@/auth";
import { db } from "@/lib/db";
import { trips, tripMembers, users, activities, tripInvites } from "@/lib/schema";
import { eq, inArray, min } from "drizzle-orm";
import { redirect } from "next/navigation";
import CreateTripDialog from "@/components/trip/CreateTripDialog";
import { JoinByUrlDialog } from "@/components/trip/JoinByUrlDialog";
import { TripTicketBoard } from "@/components/trip/TripTicketBoard";
import { EmptyDashboard } from "@/components/trip/EmptyDashboard";
import { MobileTripActionFab } from "@/components/trip/MobileTripActionFab";
import { InviteJoinDialog } from "@/components/trip/InviteJoinDialog";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ joinToken?: string }>;
}) {
  const { joinToken } = await searchParams;
  const session = await auth();
  if (!session) redirect("/login");

  // 招待トークンがある場合は招待情報を取得
  let pendingInvite: {
    token: string;
    tripId: string;
    tripName: string;
    tripEmoji: string;
    tripDestination: string | null;
    inviterName: string;
    inviterImage: string | null;
  } | null = null;
  if (joinToken) {
    const [inv] = await db
      .select({
        tripId: trips.id,
        tripName: trips.name,
        tripEmoji: trips.coverEmoji,
        tripDestination: trips.destination,
        inviterName: users.name,
        inviterImage: users.image,
      })
      .from(tripInvites)
      .innerJoin(trips, eq(trips.id, tripInvites.tripId))
      .innerJoin(users, eq(users.id, tripInvites.createdBy))
      .where(eq(tripInvites.token, joinToken))
      .limit(1);
    if (inv) {
      pendingInvite = {
        token: joinToken,
        tripId: inv.tripId,
        tripName: inv.tripName,
        tripEmoji: inv.tripEmoji,
        tripDestination: inv.tripDestination,
        inviterName: inv.inviterName ?? "メンバー",
        inviterImage: inv.inviterImage,
      };
    }
  }

  const myTrips = await db
    .select({
      id: trips.id,
      name: trips.name,
      destination: trips.destination,
      coverEmoji: trips.coverEmoji,
      createdAt: trips.createdAt,
      role: tripMembers.role,
    })
    .from(trips)
    .innerJoin(tripMembers, eq(trips.id, tripMembers.tripId))
    .where(eq(tripMembers.userId, session.user.id))
    .orderBy(trips.createdAt);

  const tripIds = myTrips.map((t) => t.id);

  const allMembers = tripIds.length > 0
    ? await db.select({
        tripId: tripMembers.tripId,
        userId: tripMembers.userId,
        name: users.name,
        image: users.image,
        role: tripMembers.role,
      })
      .from(tripMembers)
      .innerJoin(users, eq(tripMembers.userId, users.id))
      .where(inArray(tripMembers.tripId, tripIds))
    : [];

  const membersByTrip = allMembers.reduce<Record<string, typeof allMembers>>(
    (acc, m) => { (acc[m.tripId] ??= []).push(m); return acc; },
    {}
  );

  // 旅行開始日 = 各トリップの最初の activity 日付
  const activityDates = tripIds.length > 0
    ? await db
        .select({ tripId: activities.tripId, startDate: min(activities.date) })
        .from(activities)
        .where(inArray(activities.tripId, tripIds))
        .groupBy(activities.tripId)
    : [];

  const tripDateMap = activityDates.reduce<Record<string, string>>(
    (acc, r) => { if (r.startDate) acc[r.tripId] = r.startDate; return acc; },
    {}
  );

  return (
    <div className="space-y-4">
      {pendingInvite && (
        <InviteJoinDialog
          token={pendingInvite.token}
          tripId={pendingInvite.tripId}
          tripName={pendingInvite.tripName}
          tripEmoji={pendingInvite.tripEmoji}
          tripDestination={pendingInvite.tripDestination}
          inviterName={pendingInvite.inviterName}
          inviterImage={pendingInvite.inviterImage}
        />
      )}
      {/* ヘッダー */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">マイトリップ</h1>
          {myTrips.length > 0 && (
            <span className="font-mono text-[10px] font-semibold tracking-[0.22em] text-primary/70">
              {myTrips.length} TRIPS
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {myTrips.length > 0 && <MobileTripActionFab />}
          {myTrips.length > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <JoinByUrlDialog />
              <CreateTripDialog />
            </div>
          )}
        </div>
      </div>

      {myTrips.length === 0 ? (
        <EmptyDashboard />
      ) : (
        <TripTicketBoard trips={myTrips} membersByTrip={membersByTrip} tripDateMap={tripDateMap} />
      )}

    </div>
  );
}
