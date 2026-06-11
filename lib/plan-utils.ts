export interface Activity {
  id: string;
  date: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string | null;
  endTime: string | null;
  sortOrder: number | null;
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// endTime が 00:00 ぴったりの場合は日またぎとみなさない
export function crossesMidnight(startTime: string, endTime: string): boolean {
  return endTime !== "00:00" && endTime !== "00:00:00" && endTime < startTime;
}

// "9" "900" "930" "1240" "9:30" などを "HH:MM" に正規化
export function parseTime(s: string): string | null {
  s = s.trim();
  if (!s) return null;

  const colon = s.match(/^(\d{1,2}):(\d{2})$/);
  if (colon) {
    const h = parseInt(colon[1]), m = parseInt(colon[2]);
    if (h > 23 || m > 59) return null;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  const digits = s.match(/^(\d{1,4})$/)?.[1];
  if (!digits) return null;
  let h: number, m: number;
  if (digits.length <= 2) { h = parseInt(digits); m = 0; }
  else if (digits.length === 3) { h = parseInt(digits[0]); m = parseInt(digits.slice(1)); }
  else { h = parseInt(digits.slice(0, 2)); m = parseInt(digits.slice(2)); }
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// 指定時刻の直後の15分区切りを返す。真夜中をまたぐ場合は nextDay: true
export function nextQuarterHour(time: string): { time: string; nextDay: boolean } {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m;
  const rounded = Math.ceil(total / 15) * 15;
  const nextDay = rounded >= 1440;
  const mins = rounded % 1440;
  return {
    time: `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`,
    nextDay,
  };
}

export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export const DURATIONS = [
  { label: "15分",      minutes: 15 },
  { label: "30分",      minutes: 30 },
  { label: "45分",      minutes: 45 },
  { label: "1時間",     minutes: 60 },
  { label: "1時間30分", minutes: 90 },
  { label: "2時間",     minutes: 120 },
  { label: "3時間",     minutes: 180 },
  { label: "4時間",     minutes: 240 },
  { label: "半日",      minutes: 360 },
  { label: "終日",      minutes: 480 },
] as const;

/**
 * フリーテキストを分数に変換する
 * 対応フォーマット: "30分" "1時間" "1時間30分" "30" "90" "1:30" "1h30m" "1h30" "2h"
 */
export function parseDurationInput(s: string): number | null {
  s = s.trim();
  if (!s) return null;

  // ラベル完全一致
  const byLabel = DURATIONS.find((d) => d.label === s);
  if (byLabel) return byLabel.minutes;

  // "X時間Y分"
  const fullJp = s.match(/^(\d+)\s*時間\s*(\d+)\s*分?$/);
  if (fullJp) return parseInt(fullJp[1]) * 60 + parseInt(fullJp[2]);

  // "X時間"
  const hourJp = s.match(/^(\d+)\s*時間$/);
  if (hourJp) return parseInt(hourJp[1]) * 60;

  // "X分"
  const minJp = s.match(/^(\d+)\s*分$/);
  if (minJp) return parseInt(minJp[1]);

  // "H:MM" or "HH:MM"
  const colon = s.match(/^(\d{1,2}):(\d{2})$/);
  if (colon) return parseInt(colon[1]) * 60 + parseInt(colon[2]);

  // "XhYm" / "XhY"
  const hm = s.match(/^(\d+)\s*h\s*(\d+)\s*m?$/i);
  if (hm) return parseInt(hm[1]) * 60 + parseInt(hm[2]);

  // "Xh"
  const h = s.match(/^(\d+)\s*h$/i);
  if (h) return parseInt(h[1]) * 60;

  // 純粋な数字 → 分
  const num = s.match(/^(\d+)$/);
  if (num) return parseInt(num[1]);

  return null;
}

/** 分数を表示用ラベルに変換する */
export function formatDuration(minutes: number): string {
  const byLabel = DURATIONS.find((d) => d.minutes === minutes);
  if (byLabel) return byLabel.label;
  if (minutes < 60) return `${minutes}分`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

/** startTime と endTime から DURATIONS にあれば分数を、なければ "" を返す */
export function matchDuration(startTime: string, endTime: string): number | "" {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff <= 0) diff += 1440;
  return DURATIONS.find((d) => d.minutes === diff)?.minutes ?? "";
}
