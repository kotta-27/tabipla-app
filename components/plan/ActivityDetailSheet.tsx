"use client";

import { useTransition } from "react";
import { MapPin, StickyNote, ExternalLink } from "lucide-react";
import Link from "next/link";
import { DetailSheet } from "@/components/ui/DetailSheet";
import { deleteActivity } from "@/actions/plan";
import { toast } from "sonner";
import type { Activity } from "@/lib/plan-utils";
import type { Memo } from "@/types";
import { crossesMidnight } from "@/lib/plan-utils";

interface Props {
  item: Activity;
  tripId: string;
  linkedMemos: Memo[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (item: Activity) => void;
}

export function ActivityDetailSheet({ item, tripId, linkedMemos, open, onOpenChange, onEdit }: Props) {
  const [isPending, startTransition] = useTransition();

  const isCrossingMidnight =
    !!item.startTime && !!item.endTime && crossesMidnight(item.startTime, item.endTime);

  const handleDelete = () => {
    startTransition(async () => {
      await deleteActivity(item.id, tripId);
      toast.success("削除しました");
      onOpenChange(false);
    });
  };

  const handleEdit = () => {
    onOpenChange(false);
    onEdit?.(item);
  };

  return (
    <DetailSheet
      title={item.title}
      open={open}
      onOpenChange={onOpenChange}
      onEdit={onEdit ? handleEdit : undefined}
      onDelete={handleDelete}
      isDeleting={isPending}
    >
      {/* 時間 */}
      {(item.startTime || item.endTime) && (
        <p className="text-sm font-medium text-sky-600 dark:text-sky-400">
          {item.startTime?.slice(0, 5)}
          {item.endTime && ` → ${isCrossingMidnight ? "翌00:00" : item.endTime.slice(0, 5)}`}
        </p>
      )}

      {/* 場所 */}
      {item.location && (
        <div className="flex items-start gap-2">
          <MapPin size={14} className="shrink-0 mt-0.5 text-gray-400" />
          <div className="min-w-0">
            <p className="text-sm text-gray-700 dark:text-gray-300 break-all">{item.location}</p>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(item.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-0.5 text-xs text-sky-500 hover:text-sky-600 hover:underline"
            >
              <ExternalLink size={11} />
              Google マップで開く
            </a>
          </div>
        </div>
      )}

      {/* アクティビティメモ */}
      {item.description && (
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 px-3 py-2.5">
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words">{item.description}</p>
        </div>
      )}

      {/* 紐づいたメモ */}
      {linkedMemos.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">紐づけたメモ</p>
          <div className="flex flex-wrap gap-2">
            {linkedMemos.map((memo) => (
              <Link
                key={memo.id}
                href={`/trips/${tripId}/memo#memo-${memo.id}`}
                onClick={() => onOpenChange(false)}
                className="flex items-start gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-w-0 max-w-[240px] h-[110px]"
              >
                <StickyNote size={13} className="shrink-0 mt-0.5 text-amber-500" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{memo.title}</p>
                  {memo.content && (
                    <p className="text-xs text-gray-400 line-clamp-4 mt-0.5">{memo.content}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </DetailSheet>
  );
}
