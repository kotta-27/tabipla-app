"use client";

import { useState } from "react";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { TripNavLink } from "./TripNavLink";

const VARIANTS = [
  { gradient: "from-sky-400 via-sky-500 to-blue-600" },
  { gradient: "from-amber-400 via-orange-400 to-rose-500" },
  { gradient: "from-teal-400 via-cyan-500 to-sky-600" },
  { gradient: "from-rose-400 via-pink-500 to-fuchsia-600" },
  { gradient: "from-indigo-400 via-violet-500 to-purple-600" },
];

function getVariant(id: string) {
  return VARIANTS[(id.codePointAt(0) ?? 0) % VARIANTS.length];
}
function getRotation(id: string): number {
  const a = id.codePointAt(0) ?? 0;
  const b = id.codePointAt(1) ?? 0;
  return ((a + b) % 5) - 2;
}
function getYPad(id: string): number {
  return ((id.codePointAt(2) ?? 0) % 4) * 6;
}
function getFlightCode(id: string): string {
  const n = (((id.codePointAt(0) ?? 0) * 7 + (id.codePointAt(1) ?? 0)) % 900) + 100;
  return `TP-${n}`;
}

/** Ticket stub: header height = perforation line Y */
const NOTCH_Y = 96;

const TICKET_MASK: React.CSSProperties = {
  WebkitMaskImage: `radial-gradient(circle 9px at 0 ${NOTCH_Y}px, transparent 8.5px, #000 9.5px), radial-gradient(circle 9px at 100% ${NOTCH_Y}px, transparent 8.5px, #000 9.5px)`,
  maskImage: `radial-gradient(circle 9px at 0 ${NOTCH_Y}px, transparent 8.5px, #000 9.5px), radial-gradient(circle 9px at 100% ${NOTCH_Y}px, transparent 8.5px, #000 9.5px)`,
  WebkitMaskComposite: "source-in",
  maskComposite: "intersect",
};

const BARCODE: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(90deg, currentColor 0 1.5px, transparent 1.5px 3.5px), repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px 6.5px)",
};

interface Trip {
  id: string;
  name: string;
  destination: string | null;
  coverEmoji: string;
  createdAt: Date;
  role: string;
}

interface Member {
  tripId: string;
  userId: string;
  name: string | null;
  image: string | null;
  role: string;
}

interface Props {
  trips: Trip[];
  membersByTrip: Record<string, Member[]>;
  tripDateMap: Record<string, string>;
}

const UNDECIDED = "undecided";

function groupByTripMonth(trips: Trip[], tripDateMap: Record<string, string>): Record<string, Trip[]> {
  const groups: Record<string, Trip[]> = {};
  for (const trip of trips) {
    const date = tripDateMap[trip.id];
    const key = date
      ? date.slice(0, 7) // "YYYY-MM"
      : UNDECIDED;
    (groups[key] ??= []).push(trip);
  }
  return groups;
}

function sortMonthKeys(keys: string[]): string[] {
  const today = new Date().toISOString().slice(0, 7);
  const dated = keys.filter((k) => k !== UNDECIDED).sort();
  const future = dated.filter((k) => k >= today);
  const past   = dated.filter((k) => k <  today).reverse();
  const undecided = keys.includes(UNDECIDED) ? [UNDECIDED] : [];
  return [...future, ...past, ...undecided];
}

function BoardHeader({ monthKey, count }: { monthKey: string; count: number }) {
  const isUndecided = monthKey === UNDECIDED;
  const [year, month] = isUndecided ? [] : monthKey.split("-");

  return (
    <div className="relative z-10 flex items-end justify-between px-5 pt-5 sm:px-8 sm:pt-6">
      <div>
        <p className="font-mono text-[9px] font-semibold tracking-[0.28em] text-sky-700/70 dark:text-sky-300/70">
          {isUndecided ? "STANDBY" : "DEPARTURES"}
        </p>
        {isUndecided ? (
          <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            日程未定
          </p>
        ) : (
          <p className="mt-0.5 flex items-baseline gap-1.5 text-slate-800 dark:text-slate-100">
            <span className="text-3xl font-extrabold leading-none tracking-tight tabular-nums">
              {parseInt(month!)}
              <span className="ml-0.5 text-base font-bold">月</span>
            </span>
            <span className="font-mono text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400">
              {year}
            </span>
          </p>
        )}
      </div>
      <p className="pb-0.5 font-mono text-[11px] font-semibold tracking-widest text-sky-700/60 dark:text-sky-300/60">
        {count}<span className="ml-0.5">便</span>
      </p>
    </div>
  );
}

function FlightPath() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full text-sky-700/10 dark:text-sky-200/10"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
      aria-hidden
    >
      <path
        d="M -5 88 Q 28 18 55 48 T 106 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
        strokeDasharray="1.8 2.6"
      />
      <circle cx="55" cy="48" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function TripTicketBoard({ trips, membersByTrip, tripDateMap }: Props) {
  const grouped = groupByTripMonth(trips, tripDateMap);
  const months = sortMonthKeys(Object.keys(grouped));
  const [currentIdx, setCurrentIdx] = useState(0);

  if (months.length === 0) return null;

  const currentMonth = months[currentIdx];
  const currentTrips = grouped[currentMonth];

  return (
    <div className="space-y-3">
      {/* Departure lounge board */}
      <div className="relative min-h-[70vh] overflow-hidden rounded-3xl border border-sky-200/70 bg-gradient-to-b from-sky-100 via-sky-50 to-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_28px_-12px_rgba(2,80,140,0.25)] dark:border-sky-900/50 dark:from-[#0b1c30] dark:via-[#0d2034] dark:to-[#0f2336] dark:shadow-[0_8px_28px_-12px_rgba(0,0,0,0.6)]">
        {/* clouds */}
        <div className="pointer-events-none absolute -top-10 left-[8%] h-28 w-56 rounded-full bg-white/70 blur-2xl dark:bg-white/5" />
        <div className="pointer-events-none absolute top-16 right-[5%] h-20 w-44 rounded-full bg-white/60 blur-2xl dark:bg-white/5" />
        <div className="pointer-events-none absolute bottom-10 left-[30%] h-24 w-64 rounded-full bg-white/50 blur-3xl dark:bg-white/[0.04]" />
        <FlightPath />

        <BoardHeader monthKey={currentMonth} count={currentTrips.length} />

        <div
          className="
            relative z-10
            grid grid-cols-2 gap-x-4 gap-y-7
            sm:flex sm:flex-wrap sm:gap-9
            items-start
            p-4 pt-6 sm:p-8 sm:pt-7
          "
        >
          {currentTrips.map((trip, i) => {
            const members = [...(membersByTrip[trip.id] ?? [])].sort(
              (a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0)
            );
            const variant = getVariant(trip.id);
            const rot     = getRotation(trip.id);
            const yPad    = getYPad(trip.id);

            return (
              <TripNavLink
                key={trip.id}
                href={`/trips/${trip.id}/poll`}
                emoji={trip.coverEmoji}
                name={trip.name}
                className="group inline-block"
                style={{
                  paddingTop: `${yPad}px`,
                  animation: `trip-fade-up 0.45s ease-out ${i * 60}ms both`,
                } as React.CSSProperties}
              >
                <div
                  className="w-full transition-[translate,scale] duration-200 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.03] sm:w-[190px]"
                  style={{ rotate: `${rot}deg` }}
                >
                  {/* Boarding-pass ticket */}
                  <div
                    className="overflow-hidden rounded-xl bg-white shadow-[0_10px_24px_-8px_rgba(2,60,110,0.35),0_2px_6px_rgba(2,60,110,0.12)] transition-shadow duration-200 group-hover:shadow-[0_16px_32px_-8px_rgba(2,60,110,0.45),0_3px_8px_rgba(2,60,110,0.15)]"
                    style={TICKET_MASK}
                  >
                    {/* Header pane */}
                    <div
                      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${variant.gradient}`}
                      style={{ height: NOTCH_Y }}
                    >
                      <div className="absolute -top-3 -right-3 h-16 w-16 rounded-full bg-white/10" />
                      <div className="absolute -bottom-2 -left-2 h-12 w-12 rounded-full bg-white/10" />

                      <div className="absolute top-2 left-2.5 right-2.5 flex items-center justify-between font-mono text-[7.5px] font-semibold tracking-[0.22em] text-white/75">
                        <span>TABIPLA&nbsp;PASS</span>
                        <span>{getFlightCode(trip.id)}</span>
                      </div>

                      <span className="z-10 select-none text-[46px] leading-none drop-shadow-md">
                        {trip.coverEmoji}
                      </span>

                      {trip.role === "owner" && (
                        <span className="absolute bottom-1.5 right-2 rotate-[6deg] rounded-[3px] border border-white/70 px-1 py-px font-mono text-[7px] font-bold tracking-[0.18em] text-white/90">
                          OWNER
                        </span>
                      )}
                    </div>

                    {/* Perforation */}
                    <div className="border-t-2 border-dashed border-slate-300" />

                    {/* Stub */}
                    <div className="space-y-1.5 px-3 pb-2.5 pt-2">
                      <p
                        className="text-[13px] font-bold leading-snug text-slate-900"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {trip.name}
                      </p>

                      {trip.destination && (
                        <p className="flex items-center gap-0.5 text-[11px] text-slate-400">
                          <MapPin size={9} className="shrink-0" />
                          <span className="truncate">{trip.destination}</span>
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-0.5">
                        <AvatarGroup>
                          {members.slice(0, 3).map((m) => (
                            <Avatar key={m.userId} size="sm" className={m.role === "owner" ? "!ring-sky-400" : ""}>
                              {m.image && <AvatarImage src={m.image} alt={m.name ?? ""} />}
                              <AvatarFallback>{(m.name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          ))}
                          {members.length > 3 && <AvatarGroupCount>+{members.length - 3}</AvatarGroupCount>}
                        </AvatarGroup>
                        <p className="font-mono text-[10px] font-semibold tabular-nums text-slate-500">
                          {tripDateMap[trip.id]
                            ? new Date(tripDateMap[trip.id] + "T00:00:00").toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" }) + "〜"
                            : "日程未定"}
                        </p>
                      </div>

                      <div
                        className="h-3 text-slate-800 opacity-70"
                        style={BARCODE}
                      />
                    </div>
                  </div>
                </div>
              </TripNavLink>
            );
          })}
        </div>
      </div>

      {/* Month navigation */}
      {months.length > 1 && (
        <div className="flex items-center justify-center gap-5 py-1">
          <button
            onClick={() => setCurrentIdx((i) => i - 1)}
            disabled={currentIdx === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-700 shadow-sm transition-all hover:scale-110 hover:bg-sky-50 active:scale-95 disabled:opacity-25 dark:border-sky-800 dark:bg-slate-800 dark:text-sky-300 dark:hover:bg-slate-700"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Dot indicators */}
          <div className="flex items-center gap-2">
            {months.map((m, i) => (
              <button
                key={m}
                onClick={() => setCurrentIdx(i)}
                aria-label={m === UNDECIDED ? "日程未定" : m}
                className={`h-2.5 rounded-full transition-all hover:scale-110 ${
                  i === currentIdx
                    ? "w-7 bg-primary shadow-sm"
                    : "w-2.5 bg-sky-300/80 dark:bg-sky-800"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentIdx((i) => i + 1)}
            disabled={currentIdx === months.length - 1}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-700 shadow-sm transition-all hover:scale-110 hover:bg-sky-50 active:scale-95 disabled:opacity-25 dark:border-sky-800 dark:bg-slate-800 dark:text-sky-300 dark:hover:bg-slate-700"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
