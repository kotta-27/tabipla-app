"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";
import { AddExpenseDialog } from "./AddExpenseDialog";

interface Member {
  userId: string;
  name: string | null;
  role: string;
}

export function ExpenseEmptyState({ tripId, members, currentUserId }: {
  tripId: string;
  members: Member[];
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
        className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-sky-300 dark:hover:border-sky-700 min-h-[240px] cursor-pointer transition-all duration-150"
      >
        <Receipt size={36} className="text-gray-300 dark:text-gray-500 group-hover:text-sky-400 transition-colors duration-150" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-400 dark:text-gray-400 group-hover:text-sky-500 transition-colors duration-150">まだ支出がありません</p>
          <p className="text-xs text-gray-300 dark:text-gray-500 mt-1">クリックして最初の支出を追加しましょう</p>
        </div>
      </div>
      <AddExpenseDialog
        tripId={tripId}
        members={members}
        currentUserId={currentUserId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
