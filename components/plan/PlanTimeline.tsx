"use client";

import { useTransition, useState } from "react";
import { MapPin, Trash2, Pencil, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TappableCard } from "@/components/ui/TappableCard";
import { deleteActivity } from "@/actions/plan";
import { toast } from "sonner";
import { addDays, crossesMidnight, type Activity } from "@/lib/plan-utils";
import { InsertZone } from "./InsertZone";

function MobileAddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-sky-300 dark:border-sky-700 py-2 text-xs text-sky-500 dark:text-sky-400 active:bg-sky-50 dark:active:bg-sky-950/40 transition-colors"
    >
      <Plus size={13} strokeWidth={2.5} />
      プランを追加
    </button>
  );
}
import { MidnightDivider } from "./MidnightDivider";
import { QuickAddRow } from "./QuickAddRow";
import { EditPlanItemDialog } from "./EditPlanItemDialog";
import { InlineNote } from "./InlineNote";
import { ActivityMemoSection } from "./ActivityMemoSection";
import { ActivityDetailSheet } from "./ActivityDetailSheet";
import type { Memo } from "@/types";

interface Props {
  date: string;
  dayIndex: number;
  items: Activity[];
  tripId: string;
  nextDayHasTimeline?: boolean;
  continuations?: Activity[];
  memosByActivity?: Record<string, Memo[]>;
  unlinkedMemos?: Memo[];
}

export function PlanTimeline({
  date,
  dayIndex,
  items,
  tripId,
  nextDayHasTimeline,
  continuations = [],
  memosByActivity = {},
  unlinkedMemos = [],
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [insertingAfter, setInsertingAfter] = useState<{
    sortOrder: number;
    afterTime: string | null;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Activity | null>(null);
  const [detailItem, setDetailItem] = useState<Activity | null>(null);
  const [mobileAdding, setMobileAdding] = useState(false);

  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const confirmDelete = () => {
    if (!deletingId) return;
    const id = deletingId;
    setDeletingId(null);
    startTransition(async () => {
      await deleteActivity(id, tripId);
      toast.success("削除しました");
    });
  };

  const closeInsert = () => setInsertingAfter(null);

  return (
    <div>
      {/* 日付ヘッダー */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-600 text-white text-sm font-bold shrink-0">
          {dayIndex}
        </div>
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">{dateLabel}</h3>
      </div>

      {/* タイムライン */}
      <div className="ml-4 border-l-2 border-sky-200 dark:border-sky-800 pl-6">
        {/* 前日から日またぎしているアイテムの続きカード */}
        {continuations.map((item) => (
          <Card key={`cont-${item.id}`} className="shadow-sm border-dashed opacity-80 mb-2">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-sky-400 font-medium mb-1">
                00:00 → {item.endTime?.slice(0, 5)}
              </p>
              <p className="text-sm text-gray-500">{item.title}</p>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 ? (
          <>
            {/* デスクトップ: hover で挿入 */}
            {insertingAfter?.sortOrder === -1 ? (
              <QuickAddRow tripId={tripId} date={date} insertAfterSortOrder={-1} onDone={closeInsert} />
            ) : (
              <InsertZone onClick={() => setInsertingAfter({ sortOrder: -1, afterTime: null })} />
            )}
            {/* モバイル: 常時表示ボタン */}
            <div className="sm:hidden">
              {mobileAdding ? (
                <QuickAddRow tripId={tripId} date={date} insertAfterSortOrder={-1} onDone={() => setMobileAdding(false)} />
              ) : (
                <MobileAddButton onClick={() => setMobileAdding(true)} />
              )}
            </div>
          </>
        ) : (
          <>
          {items.map((item) => {
            const sortOrder = item.sortOrder ?? 0;
            const isCrossingMidnight =
              !!item.startTime && !!item.endTime &&
              crossesMidnight(item.startTime, item.endTime);

            return (
              <div key={item.id} className="mb-3 sm:mb-0">
                <TappableCard
                  onClick={() => setDetailItem(item)}
                  menuItems={[
                    { label: "編集", icon: <Pencil size={14} />, onClick: () => setEditingItem(item) },
                    { label: "削除", icon: <Trash2 size={14} />, onClick: () => setDeletingId(item.id), variant: "destructive", separator: true },
                  ]}
                >
                  <CardContent className="py-3 px-4">
                    {/* メインコンテンツ */}
                    <div className="pr-6">
                      {(item.startTime || item.endTime) && (
                        <p className="text-xs text-sky-500 font-medium mb-1">
                          {item.startTime?.slice(0, 5)}
                          {item.endTime && ` → ${isCrossingMidnight ? "00:00" : item.endTime.slice(0, 5)}`}
                        </p>
                      )}
                      <p className="font-medium text-sm">{item.title}</p>
                      {item.location && (
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <MapPin size={10} className="shrink-0" />
                          {item.location}
                        </p>
                      )}
                      <InlineNote
                        activityId={item.id}
                        tripId={tripId}
                        value={item.description}
                      />
                    </div>
                    {/* メモセクション: モバイルはリンク済みメモがある時のみ表示 */}
                    {((memosByActivity[item.id] ?? []).length > 0) ? (
                      <div
                        className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ActivityMemoSection
                          activityId={item.id}
                          tripId={tripId}
                          linkedMemos={memosByActivity[item.id] ?? []}
                          unlinkedMemos={unlinkedMemos}
                        />
                      </div>
                    ) : (
                      <div
                        className="hidden sm:block mt-2 pt-2 border-t border-gray-100 dark:border-gray-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ActivityMemoSection
                          activityId={item.id}
                          tripId={tripId}
                          linkedMemos={[]}
                          unlinkedMemos={unlinkedMemos}
                        />
                      </div>
                    )}
                  </CardContent>
                </TappableCard>

                {/* 日またぎ: 翌日タイムラインがない場合のみここに表示 */}
                {isCrossingMidnight && item.endTime && !nextDayHasTimeline && (
                  <>
                    <MidnightDivider date={addDays(date, 1)} dayIndex={dayIndex + 1} />
                    <Card className="shadow-sm border-dashed opacity-80">
                      <CardContent className="py-3 px-4">
                        <p className="text-xs text-sky-400 font-medium mb-1">
                          00:00 → {item.endTime.slice(0, 5)}
                        </p>
                        <p className="text-sm text-gray-500">{item.title}</p>
                      </CardContent>
                    </Card>
                  </>
                )}

                {insertingAfter?.sortOrder === sortOrder ? (
                  <QuickAddRow
                    tripId={tripId}
                    date={isCrossingMidnight ? addDays(date, 1) : date}
                    insertAfterSortOrder={sortOrder}
                    defaultStartTime={insertingAfter.afterTime}
                    onDone={closeInsert}
                  />
                ) : (
                  <InsertZone onClick={() => setInsertingAfter({
                    sortOrder,
                    afterTime: item.endTime ?? item.startTime ?? null,
                  })} />
                )}
              </div>
            );
          })}
          {/* モバイル: 末尾追加ボタン */}
          {(() => {
            const last = items[items.length - 1];
            const lastSortOrder = last?.sortOrder ?? 0;
            const lastAfterTime = last?.endTime ?? last?.startTime ?? null;
            return (
              <div className="sm:hidden mt-2">
                {mobileAdding ? (
                  <QuickAddRow
                    tripId={tripId}
                    date={date}
                    insertAfterSortOrder={lastSortOrder}
                    defaultStartTime={lastAfterTime}
                    onDone={() => setMobileAdding(false)}
                  />
                ) : (
                  <MobileAddButton onClick={() => setMobileAdding(true)} />
                )}
              </div>
            );
          })()}
          </>
        )}
      </div>

      {/* 詳細シート (モバイルタップ) */}
      {detailItem && (
        <ActivityDetailSheet
          key={detailItem.id}
          item={detailItem}
          tripId={tripId}
          linkedMemos={memosByActivity[detailItem.id] ?? []}
          open={true}
          onOpenChange={(open) => { if (!open) setDetailItem(null); }}
          onEdit={(item) => { setDetailItem(null); setEditingItem(item); }}
        />
      )}

      {/* 編集ダイアログ */}
      {editingItem && (
        <EditPlanItemDialog
          key={editingItem.id}
          tripId={tripId}
          item={editingItem}
          open={true}
          onOpenChange={(open) => { if (!open) setEditingItem(null); }}
          linkedMemos={memosByActivity[editingItem.id] ?? []}
          unlinkedMemos={unlinkedMemos}
        />
      )}

      {/* 削除確認ダイアログ */}
      <Dialog open={deletingId !== null} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>このプランを削除しますか？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 mt-1">削除したプランは元に戻せません。</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setDeletingId(null)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDelete}
              disabled={isPending}
              className="gap-1.5"
            >
              <Trash2 size={14} />
              削除する
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
