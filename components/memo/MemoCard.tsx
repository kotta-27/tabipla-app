"use client";

import { useState, useEffect } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import { TappableCard } from "@/components/ui/TappableCard";
import { MemoDetailSheet } from "./MemoDetailSheet";
import type { Memo } from "@/types";

interface Props {
  memo: Memo;
  tripId: string;
  activityInfo?: { title: string; date: string };
}

export function MemoCard({ memo, tripId, activityInfo }: Props) {
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === `#memo-${memo.id}`) {
      const timer = setTimeout(() => {
        setDetailOpen(true);
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [memo.id]);

  const updatedAt = new Date(memo.updatedAt).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const activityLabel = activityInfo
    ? new Date(activityInfo.date + "T00:00:00").toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" }) +
      " " + activityInfo.title
    : null;

  const menuItems = [
    { label: "編集", icon: <Pencil size={14} />, onClick: () => setDetailOpen(true) },
    { label: "削除", icon: <Trash2 size={14} />, onClick: () => setDetailOpen(true), variant: "destructive" as const, separator: true },
  ];

  return (
    <>
      <TappableCard
        id={`memo-${memo.id}`}
        className="scroll-mt-4 h-44 overflow-hidden"
        onClick={() => setDetailOpen(true)}
        menuItems={menuItems}
      >
        <CardHeader className="pb-2">
          <div className="flex-1 min-w-0 pl-6 pr-8">
            {activityLabel && (
              <div className="flex items-center gap-1 mb-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 px-2 py-0.5 text-xs text-sky-600 dark:text-sky-400">
                  <MapPin size={10} />
                  <span className="truncate max-w-[160px]">{activityLabel}</span>
                </span>
              </div>
            )}
            <CardTitle className="text-sm font-semibold">{memo.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="pl-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap line-clamp-3">
              {memo.content || "（内容なし）"}
            </p>
            <p className="text-xs text-gray-400 mt-3">{updatedAt} 更新</p>
          </div>
        </CardContent>
      </TappableCard>

      <MemoDetailSheet
        memo={memo}
        tripId={tripId}
        activityInfo={activityInfo}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
