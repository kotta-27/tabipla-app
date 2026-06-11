"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, MapPin, StickyNote, Receipt, Settings } from "lucide-react";

const TABS = [
  { href: "poll", label: "日程調整", icon: CalendarClock },
  { href: "plan",     label: "プラン",   icon: MapPin },
  { href: "memo",     label: "メモ",     icon: StickyNote },
  { href: "expense",  label: "費用",     icon: Receipt },
  { href: "settings", label: "設定",     icon: Settings },
];

export function TripTabs({ tripId }: { tripId: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: top horizontal tabs */}
      <nav className="hidden sm:flex border-b overflow-x-auto">
        {TABS.map((tab) => {
          const href = `/trips/${tripId}/${tab.href}`;
          const isActive = pathname === href || pathname.startsWith(href + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={href}
              className={[
                "relative flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "text-sky-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-sky-500"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 hover:bg-gray-100/60 dark:hover:text-gray-200 dark:hover:bg-white/5",
              ].join(" ")}
            >
              <Icon size={15} />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile: fixed bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 px-2 py-2 !mb-0">
        <div className="flex">
          {TABS.map((tab) => {
            const href = `/trips/${tripId}/${tab.href}`;
            const isActive = pathname === href || pathname.startsWith(href + "/");
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={href}
                className={[
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                  isActive ? "text-sky-600" : "text-gray-400 dark:text-gray-500",
                ].join(" ")}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
