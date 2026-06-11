import { auth } from "@/auth";
import { db } from "@/lib/db";
import { memos, activities } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { MemoSortableList } from "@/components/memo/MemoSortableList";
import { CreateMemoDialog } from "@/components/memo/CreateMemoDialog";
import { StickyNote } from "lucide-react";

async function MemoContent({ tripId }: { tripId: string }) {
  const session = await auth();
  if (!session) redirect("/login");

  const [allMemos, allActivities] = await Promise.all([
    db.select().from(memos).where(eq(memos.tripId, tripId)).orderBy(memos.createdAt),
    db
      .select({ id: activities.id, title: activities.title, date: activities.date })
      .from(activities)
      .where(eq(activities.tripId, tripId))
      .orderBy(activities.date),
  ]);

  const activityMap = allActivities.reduce<Record<string, { title: string; date: string }>>(
    (acc, a) => { acc[a.id] = { title: a.title, date: a.date }; return acc; },
    {}
  );

  if (allMemos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 min-h-[240px] gap-3">
        <StickyNote size={36} className="text-gray-300 dark:text-gray-500" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-400 dark:text-gray-400">まだメモがありません</p>
          <p className="text-xs text-gray-300 dark:text-gray-500 mt-1">右上のボタンから追加しましょう</p>
        </div>
      </div>
    );
  }

  return (
    <MemoSortableList
      initialMemos={allMemos}
      tripId={tripId}
      activityMap={activityMap}
    />
  );
}

export default async function MemoPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">メモ</h2>
        <CreateMemoDialog tripId={tripId} />
      </div>
      <MemoContent tripId={tripId} />
    </div>
  );
}
