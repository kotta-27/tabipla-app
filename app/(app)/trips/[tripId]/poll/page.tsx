import { Suspense } from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { polls, pollDates, pollResponses, tripMembers, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { CreatePollDialog } from "@/components/poll/CreatePollDialog";
import { PollGrid } from "@/components/poll/PollGrid";
import { UnansweredBanner } from "@/components/poll/UnansweredBanner";
import { PageLoading } from "@/components/ui/loading";
import { CalendarClock } from "lucide-react";

async function PollContent({ tripId }: { tripId: string }) {
  const t0 = performance.now();

  const session = await auth();
  if (!session) redirect("/login");
  console.log(`[poll] auth: ${(performance.now() - t0).toFixed(0)}ms`);

  const t1 = performance.now();
  const [pollList, members] = await Promise.all([
    db.select().from(polls).where(eq(polls.tripId, tripId)).orderBy(polls.createdAt),
    db
      .select({ userId: tripMembers.userId, role: tripMembers.role, name: users.name, image: users.image })
      .from(tripMembers)
      .innerJoin(users, eq(tripMembers.userId, users.id))
      .where(eq(tripMembers.tripId, tripId)),
  ]);

  const isOwner = members.some((m) => m.userId === session.user.id && m.role === "owner");
  console.log(`[poll] polls+members fetch: ${(performance.now() - t1).toFixed(0)}ms (${pollList.length} polls)`);

  const t2 = performance.now();
  const pollsWithData = await Promise.all(
    pollList.map(async (poll) => {
      const dates = await db.select().from(pollDates).where(eq(pollDates.pollId, poll.id)).orderBy(pollDates.sortOrder);
      const responses = dates.length
        ? await db.select().from(pollResponses).where(eq(pollResponses.pollId, poll.id))
        : [];
      return {
        ...poll,
        poll_dates: dates.map((d) => ({
          ...d,
          poll_responses: responses.filter((r) => r.dateId === d.id),
        })),
      };
    })
  );
  console.log(`[poll] per-poll fetch (N+1): ${(performance.now() - t2).toFixed(0)}ms`);
  console.log(`[poll] total: ${(performance.now() - t0).toFixed(0)}ms`);

  // 自分がまだ1つも回答していないポール
  const myAnsweredPollIds = new Set(
    pollsWithData
      .filter((p) => p.poll_dates.some((d) => d.poll_responses.some((r) => r.userId === session.user.id)))
      .map((p) => p.id)
  );
  const unansweredPolls = pollsWithData.filter((p) => p.poll_dates.length > 0 && !myAnsweredPollIds.has(p.id));

  return (
    <>
      {unansweredPolls.length > 0 && (
        <UnansweredBanner count={unansweredPolls.length} firstPollId={unansweredPolls[0].id} />
      )}
      {pollsWithData.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 py-12 text-center">
          <CalendarClock size={40} className="mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-300">まだ日程調整がありません</p>
          <p className="text-sm text-gray-400 dark:text-gray-400 mt-1">右上のボタンから日程を調整しましょう</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pollsWithData.map((poll) => (
            <div key={poll.id} id={`poll-${poll.id}`}>
              <PollGrid
                poll={poll}
                members={members}
                currentUserId={session.user.id}
                tripId={tripId}
                isOwner={isOwner}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default async function PollPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">日程調整</h2>
        <CreatePollDialog tripId={tripId} />
      </div>
      <Suspense fallback={<PageLoading />}>
        <PollContent tripId={tripId} />
      </Suspense>
    </div>
  );
}
