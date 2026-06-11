"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import {
  parseTime, nextQuarterHour, addMinutes,
  matchDuration, DURATIONS, parseDurationInput, formatDuration,
} from "@/lib/plan-utils";

export function StartDurationInput({
  defaultStartTime,
  initialStartTime,
  initialEndTime,
  onStartTimeChange,
}: {
  defaultStartTime?: string | null;
  initialStartTime?: string | null;
  initialEndTime?: string | null;
  onStartTimeChange?: (time: string | null) => void;
}) {
  const initialStart = initialStartTime?.slice(0, 5) ?? "";
  const initialDurationMins =
    initialStart && initialEndTime
      ? matchDuration(initialStart, initialEndTime.slice(0, 5))
      : "";

  const [startText, setStartText] = useState(initialStart);
  const [durationText, setDurationText] = useState(
    initialDurationMins !== ""
      ? formatDuration(initialDurationMins as number)
      : ""
  );

  const placeholder = defaultStartTime ? nextQuarterHour(defaultStartTime).time : "9:00";
  const startTime = parseTime(startText);
  const durationMins = parseDurationInput(durationText);
  const endTime = startTime && durationMins !== null ? addMinutes(startTime, durationMins) : null;
  const isInvalid = startText.trim() !== "" && !startTime;
  const isDurationInvalid = durationText.trim() !== "" && durationMins === null;

  const listId = "duration-options";

  return (
    <div className="flex items-center gap-1 shrink-0 flex-wrap">
      {/* モバイル: OS ネイティブ時刻ピッカー */}
      <input
        type="time"
        value={startText}
        onChange={(e) => {
          const val = e.target.value;
          setStartText(val);
          onStartTimeChange?.(val || null);
        }}
        className={`
          sm:hidden h-8 px-2 text-xs rounded-md border bg-background shadow-sm
          outline-none focus:ring-2 focus:ring-sky-400/60 transition-colors
          ${isInvalid ? "border-red-300" : "border-input"}
          ${startTime ? "text-sky-600 font-medium" : ""}
        `}
        style={{ width: 88 }}
      />

      {/* デスクトップ: テキスト入力 */}
      <div className="hidden sm:block relative w-[88px]">
        <Clock size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          value={startText}
          onChange={(e) => {
            setStartText(e.target.value);
            onStartTimeChange?.(parseTime(e.target.value));
          }}
          onBlur={() => { if (startTime) setStartText(startTime); }}
          placeholder={placeholder}
          className={`
            w-full h-8 pl-6 pr-2 text-xs rounded-md border bg-background shadow-sm
            outline-none focus:ring-2 focus:ring-sky-400/60 transition-colors
            ${isInvalid ? "border-red-300" : "border-input"}
            ${startTime ? "text-sky-600 font-medium" : ""}
          `}
        />
      </div>

      <span className="text-[11px] text-gray-400 select-none">+</span>

      {/* 所要時間: 入力 + datalist */}
      <input
        list={listId}
        value={durationText}
        onChange={(e) => setDurationText(e.target.value)}
        onBlur={() => {
          if (durationMins !== null) setDurationText(formatDuration(durationMins));
          else if (durationText.trim() === "") setDurationText("");
        }}
        placeholder="所要時間"
        disabled={!startTime}
        className={`
          h-8 pl-2 pr-2 text-xs rounded-md border bg-background shadow-sm
          outline-none focus:ring-2 focus:ring-sky-400/60 transition-colors
          ${!startTime ? "opacity-40" : ""}
          ${isDurationInvalid ? "border-red-300" : endTime ? "border-sky-300" : "border-input"}
          ${endTime ? "text-sky-600 font-medium" : ""}
        `}
        style={{ width: 100 }}
      />
      <datalist id={listId}>
        {DURATIONS.map((d) => (
          <option key={d.minutes} value={d.label} />
        ))}
      </datalist>

      {endTime && (
        <span className="text-[11px] text-sky-500 font-medium whitespace-nowrap">→ {endTime}</span>
      )}

      <input type="hidden" name="start_time" value={startTime ?? ""} />
      <input type="hidden" name="end_time" value={endTime ?? ""} />
    </div>
  );
}
