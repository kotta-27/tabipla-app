"use client";

import { useState } from "react";
import { AddButton } from "@/components/ui/AddButton";
import { AddPlanItemDialog } from "./AddPlanItemDialog";
import type { Memo } from "@/types";

export function PlanHeader({ tripId, unlinkedMemos = [] }: { tripId: string; unlinkedMemos?: Memo[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">プラン</h2>
      <AddButton label="プランを追加" onClick={() => setOpen(true)} />
      <AddPlanItemDialog tripId={tripId} open={open} onOpenChange={setOpen} unlinkedMemos={unlinkedMemos} />
    </div>
  );
}
