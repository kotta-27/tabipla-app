"use client";

import { CalendarClock } from "lucide-react";

export function UnansweredBanner({ count, firstPollId }: { count: number; firstPollId: string }) {
  const handleScroll = () => {
    document.getElementById(`poll-${firstPollId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex items-center gap-3 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 px-4 py-3">
      <CalendarClock size={20} className="shrink-0 text-sky-500 dark:text-sky-400" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-sky-800 dark:text-sky-200">
          日程調整が{count > 1 ? `${count}件` : ""}作成されました！
        </p>
        <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">
          回答して旅行日程を決めましょう
        </p>
      </div>
      <button
        type="button"
        onClick={handleScroll}
        className="text-xs font-medium text-sky-600 dark:text-sky-400 shrink-0 hover:text-sky-800 dark:hover:text-sky-200 transition-colors cursor-pointer"
      >
        ↓ スクロール
      </button>
    </div>
  );
}
