"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TripNavLink } from "./TripNavLink";
import { TripTicketCard } from "./TripTicketCard";
import type { TripTicketMember } from "./TripTicketCard";

function getRotation(id: string): number {
  const a = id.codePointAt(0) ?? 0;
  const b = id.codePointAt(1) ?? 0;
  return ((a + b) % 5) - 2;
}
function getYPad(id: string): number {
  return ((id.codePointAt(2) ?? 0) % 4) * 6;
}

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
            const rot  = getRotation(trip.id);
            const yPad = getYPad(trip.id);

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
                  <TripTicketCard
                    tripId={trip.id}
                    tripName={trip.name}
                    tripEmoji={trip.coverEmoji}
                    tripDestination={trip.destination}
                    members={members as TripTicketMember[]}
                    startDate={tripDateMap[trip.id] ?? null}
                    role={trip.role}
                    className="transition-shadow duration-200 group-hover:shadow-[0_16px_32px_-8px_rgba(2,60,110,0.45),0_3px_8px_rgba(2,60,110,0.15)] !w-full sm:!w-[190px]"
                  />
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
