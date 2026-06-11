"use client";

import { useState } from "react";
import { Plus, MapPin } from "lucide-react";
import { AddPlanItemDialog } from "./AddPlanItemDialog";

interface Props {
  tripId: string;
  isEmpty?: boolean;
}

export function PlanAddZone({ tripId, isEmpty }: Props) {
  const [open, setOpen] = useState(false);

  if (isEmpty) {
    return (
      <>
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 min-h-[240px] gap-3">
          <MapPin size={36} className="text-gray-300 dark:text-gray-500" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-400 dark:text-gray-400">まだプランがありません</p>
            <p className="text-xs text-gray-300 dark:text-gray-500 mt-1">右上のボタンから追加しましょう</p>
          </div>
        </div>
        <AddPlanItemDialog tripId={tripId} open={open} onOpenChange={setOpen} />
      </>
    );
  }

  return null;
}
