import { Suspense } from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { activities, memos } from "@/lib/schema";
import { eq, asc, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { PlanTimeline } from "@/components/plan/PlanTimeline";
import { PlanAddZone } from "@/components/plan/PlanAddZone";
import { PlanHeader } from "@/components/plan/PlanHeader";
import { PageLoading } from "@/components/ui/loading";
import { addDays, crossesMidnight, type Activity } from "@/lib/plan-utils";
import type { Memo } from "@/types";

async function PlanContent({ tripId }: { tripId: string }) {
  const session = await auth();
  if (!session) redirect("/login");

  const [items, allMemos] = await Promise.all([
    db
      .select()
      .from(activities)
      .where(eq(activities.tripId, tripId))
      .orderBy(activities.date, sql`${activities.startTime} ASC NULLS LAST`, asc(activities.sortOrder)),
    db.select().from(memos).where(eq(memos.tripId, tripId)),
  ]);

  const memosByActivity = allMemos.reduce<Record<string, Memo[]>>((acc, m) => {
    if (m.activityId) {
      acc[m.activityId] = acc[m.activityId] ?? [];
      acc[m.activityId].push(m as Memo);
    }
    return acc;
  }, {});

  const unlinkedMemos = allMemos.filter((m) => !m.activityId) as Memo[];

  const grouped = items.reduce<Record<string, Activity[]>>((acc, item) => {
    acc[item.date] = acc[item.date] ?? [];
    acc[item.date].push(item as Activity);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  if (sortedDates.length === 0) {
    return (
      <>
        <PlanHeader tripId={tripId} unlinkedMemos={unlinkedMemos} />
        <PlanAddZone tripId={tripId} isEmpty />
      </>
    );
  }

  return (
    <>
      <PlanHeader tripId={tripId} unlinkedMemos={unlinkedMemos} />
      <div className="space-y-6">
      {sortedDates.map((date, i) => {
        const nextDayHasTimeline = sortedDates[i + 1] === addDays(date, 1);
        const prevDate = sortedDates[i - 1];
        const continuations: Activity[] = prevDate === addDays(date, -1)
          ? (grouped[prevDate] ?? []).filter(
              (item) => item.startTime && item.endTime && crossesMidnight(item.startTime, item.endTime)
            )
          : [];

        return (
          <PlanTimeline
            key={date}
            date={date}
            dayIndex={i + 1}
            items={grouped[date]}
            tripId={tripId}
            nextDayHasTimeline={nextDayHasTimeline}
            continuations={continuations}
            memosByActivity={memosByActivity}
            unlinkedMemos={unlinkedMemos}
          />
        );
      })}
      </div>
    </>
  );
}

export default async function PlanPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;

  return (
    <div className="space-y-6">
      <Suspense fallback={<PageLoading />}>
        <PlanContent tripId={tripId} />
      </Suspense>
    </div>
  );
}
