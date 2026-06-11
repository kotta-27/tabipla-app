"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toDateString(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDateRange(a: string, b: string): Set<string> {
  const start = new Date(a < b ? a : b);
  const end = new Date(a < b ? b : a);
  const set = new Set<string>();
  const cur = new Date(start);
  while (cur <= end) {
    set.add(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return set;
}

interface DatePickerProps {
  value: string[];
  onChange: (dates: string[]) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragCurrent, setDragCurrent] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<"select" | "deselect">("select");
  const gridRef = useRef<HTMLDivElement>(null);
  const touchCommittedRef = useRef(false);

  const [hintVisible, setHintVisible] = useState(false);
  const [hintFading, setHintFading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHintVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (value.length > 0 && hintVisible) {
      setHintFading(true);
      const t = setTimeout(() => { setHintVisible(false); setHintFading(false); }, 600);
      return () => clearTimeout(t);
    }
  }, [value.length]);

  const selectedSet = new Set(value);
  const rangeSet = dragStart && dragCurrent ? getDateRange(dragStart, dragCurrent) : new Set<string>();

  const commitDrag = useCallback((fromTouch = false) => {
    if (!dragStart || !dragCurrent) return;
    const range = getDateRange(dragStart, dragCurrent);
    let next: string[];
    if (dragMode === "select") {
      const adding = [...range].filter((d) => !selectedSet.has(d));
      next = [...value, ...adding].sort();
    } else {
      next = value.filter((d) => !range.has(d));
    }
    onChange(next);
    setDragStart(null);
    setDragCurrent(null);
    touchCommittedRef.current = true;
  }, [dragStart, dragCurrent, dragMode, value, onChange, selectedSet]);

  useEffect(() => {
    if (!dragStart) return;
    const up = () => commitDrag();
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, [dragStart, commitDrag]);

  // タッチドラッグ: touchmove で elementFromPoint で日付セルを特定
  useEffect(() => {
    if (!dragStart) return;
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // スクロール防止
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const dateStr = el?.closest("[data-date]")?.getAttribute("data-date");
      if (dateStr) setDragCurrent(dateStr);
    };
    const grid = gridRef.current;
    grid?.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => grid?.removeEventListener("touchmove", handleTouchMove);
  }, [dragStart]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const toggle = (dateStr: string) => {
    if (selectedSet.has(dateStr)) onChange(value.filter(d => d !== dateStr));
    else onChange([...value, dateStr].sort());
  };

  const handleMouseDown = (dateStr: string) => {
    setDragStart(dateStr);
    setDragCurrent(dateStr);
    setDragMode(selectedSet.has(dateStr) ? "deselect" : "select");
  };

  const handleTouchStart = (dateStr: string, e: React.TouchEvent) => {
    e.preventDefault();
    setDragStart(dateStr);
    setDragCurrent(dateStr);
    setDragMode(selectedSet.has(dateStr) ? "deselect" : "select");
  };

  const handleMouseEnter = (dateStr: string) => {
    if (dragStart) setDragCurrent(dateStr);
  };

  const handleClick = (dateStr: string) => {
    if (touchCommittedRef.current) {
      touchCommittedRef.current = false;
      return;
    }
    if (dragStart === dragCurrent) toggle(dateStr);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);
  const todayStr = toDateString(today.getFullYear(), today.getMonth(), today.getDate());

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="select-none relative">
      {hintVisible && (
        <div
          className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-sky-500 px-3 py-1.5 text-xs font-medium text-white shadow-md pointer-events-none"
          style={{
            opacity: hintFading ? 0 : 1,
            transition: "opacity 0.6s ease",
          }}
        >
          ドラッグで範囲選択できます
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-sky-500" />
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <Button type="button" variant="ghost" size="sm" onClick={prevMonth} className="h-9 w-9 p-0"><ChevronLeft size={16} /></Button>
        <span className="text-sm font-semibold">{year}年 {month + 1}月</span>
        <Button type="button" variant="ghost" size="sm" onClick={nextMonth} className="h-9 w-9 p-0"><ChevronRight size={16} /></Button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={`text-center text-xs font-medium py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-500 dark:text-gray-300"}`}>
            {d}
          </div>
        ))}
      </div>

      <div ref={gridRef} className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const dateStr = toDateString(year, month, day);
          const isSelected = selectedSet.has(dateStr);
          const inRange = rangeSet.has(dateStr);
          const isToday = dateStr === todayStr;
          const dow = (firstDow + day - 1) % 7;
          const isDragging = dragStart !== null;

          let cls = "mx-auto flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full text-sm transition-colors cursor-pointer touch-none ";

          if (inRange && isDragging) {
            cls += dragMode === "select"
              ? "bg-sky-300 text-white font-semibold ring-2 ring-sky-400"
              : "bg-red-200 text-red-700 font-semibold ring-2 ring-red-300";
          } else if (isSelected) {
            cls += "bg-sky-600 text-white font-semibold";
          } else if (isToday) {
            cls += "border border-sky-300 text-sky-600 hover:bg-sky-50";
          } else if (dow === 0) {
            cls += "text-red-400 hover:bg-red-50";
          } else if (dow === 6) {
            cls += "text-blue-400 hover:bg-blue-50";
          } else {
            cls += "text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700";
          }

          return (
            <button
              key={dateStr}
              type="button"
              data-date={dateStr}
              className={cls}
              onMouseDown={() => handleMouseDown(dateStr)}
              onMouseEnter={() => handleMouseEnter(dateStr)}
              onTouchStart={(e) => handleTouchStart(dateStr, e)}
              onClick={() => handleClick(dateStr)}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t min-h-[52px]">
        <p className="text-xs text-gray-500 mb-1.5">
          {value.length > 0 ? `選択中 (${value.length}日)` : "日付を選択してください"}
        </p>
        <div className="flex flex-wrap gap-1">
          {value.map(d => {
            const dt = new Date(d + "T00:00:00");
            return (
              <span key={d} className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
                {dt.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" })}
                <button type="button" onClick={() => toggle(d)} className="hover:text-sky-900"><X size={10} /></button>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
