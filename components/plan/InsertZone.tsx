"use client";

import { Plus } from "lucide-react";

export function InsertZone({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="group relative hidden sm:flex h-7 cursor-pointer items-center justify-center"
      onClick={onClick}
    >
      <div className="absolute inset-x-0 top-1/2 -translate-y-px border-t border-dashed border-sky-200 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
      <div className="relative z-10 w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-sm opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150">
        <Plus size={13} strokeWidth={2.5} />
      </div>
    </div>
  );
}
