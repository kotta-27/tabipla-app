"use client";

import { useState, useTransition } from "react";
import { StickyNote, Plus, X } from "lucide-react";
import Link from "next/link";
import { Tooltip } from "@base-ui/react/tooltip";
import { unlinkMemoFromActivity } from "@/actions/memo";
import { LinkMemoDialog } from "./LinkMemoDialog";
import { toast } from "sonner";
import type { Memo } from "@/types";

interface Props {
  activityId: string;
  tripId: string;
  linkedMemos: Memo[];
  unlinkedMemos: Memo[];
}

export function ActivityMemoSection({ activityId, tripId, linkedMemos, unlinkedMemos }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleUnlink = (memoId: string) => {
    startTransition(async () => {
      await unlinkMemoFromActivity(memoId, tripId);
      toast.success("紐づけを解除しました");
    });
  };

  if (linkedMemos.length === 0) {
    return (
      <>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="hidden sm:flex items-center gap-1 text-xs text-gray-300 hover:text-sky-400 transition-colors"
        >
          <StickyNote size={11} />
          <span className="whitespace-nowrap">メモ</span>
        </button>
        <LinkMemoDialog
          activityId={activityId}
          tripId={tripId}
          unlinkedMemos={unlinkedMemos}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-1">
        <Tooltip.Provider delay={300}>
          {linkedMemos.map((memo) => (
            <span
              key={memo.id}
              className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300"
            >
              <StickyNote size={10} className="shrink-0" />
              <Tooltip.Root>
                <Tooltip.Trigger render={
                  <Link
                    href={`/trips/${tripId}/memo#memo-${memo.id}`}
                    className="max-w-[120px] truncate hover:underline"
                  />
                }>
                  {memo.title}
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Positioner sideOffset={6}>
                    <Tooltip.Popup className="z-50 max-w-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 shadow-xl">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1.5">{memo.title}</p>
                      {memo.content ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-6 whitespace-pre-wrap">{memo.content}</p>
                      ) : (
                        <p className="text-sm text-gray-300 dark:text-gray-600 italic">内容なし</p>
                      )}
                    </Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </Tooltip.Root>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleUnlink(memo.id)}
                className="hidden sm:inline ml-0.5 text-amber-400 hover:text-amber-600 dark:hover:text-amber-200 transition-colors"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </Tooltip.Provider>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="hidden sm:inline-flex items-center gap-0.5 rounded-full border border-dashed border-gray-300 dark:border-gray-600 px-2 py-0.5 text-xs text-gray-400 hover:border-sky-400 hover:text-sky-500 transition-colors"
        >
          <Plus size={10} />
        </button>
      </div>
      <LinkMemoDialog
        activityId={activityId}
        tripId={tripId}
        unlinkedMemos={unlinkedMemos}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
