"use client";

export function MidnightDivider({ date, dayIndex }: { date: string; dayIndex: number }) {
  const label = new Date(date + "T00:00:00").toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  return (
    <div className="relative py-4">
      {/* タイムラインの縦線を背景色で隠してバッジ周囲に空白を作る */}
      <div className="absolute left-[-26px] inset-y-0 w-[4px] bg-gray-50 dark:bg-gray-950 z-0" />
      <div className="relative z-10 flex items-center gap-3 -ml-[42px]">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-600 text-white text-sm font-bold shrink-0">
          {dayIndex}
        </div>
        <h3 className="font-semibold text-gray-800">{label}</h3>
      </div>
    </div>
  );
}
