"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { createActivityAt } from "@/actions/plan";
import { addDays } from "@/lib/plan-utils";
import { toast } from "sonner";
import { StartDurationInput } from "./StartDurationInput";
import { LocationInput } from "./LocationInput";

export function QuickAddRow({
  tripId,
  date,
  insertAfterSortOrder,
  defaultStartTime,
  onDone,
}: {
  tripId: string;
  date: string;
  insertAfterSortOrder: number;
  defaultStartTime?: string | null;
  onDone: () => void;
}) {
  const titleRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [enteredTime, setEnteredTime] = useState<string | null>(null);

  const nextDay =
    defaultStartTime === "00:00"
      ? enteredTime !== null
      : !!defaultStartTime && enteredTime !== null && enteredTime < defaultStartTime;
  const effectiveDate = nextDay ? addDays(date, 1) : date;

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onDone();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = (formData.get("title") as string).trim();
    if (!title) { titleRef.current?.focus(); return; }
    setPending(true);
    try {
      await createActivityAt(tripId, insertAfterSortOrder, formData);
      toast.success("プランを追加しました");
      onDone();
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="my-4 shadow-sm border-sky-300 dark:border-sky-700 bg-sky-50/50 dark:bg-sky-950/40">
      <CardContent className="py-3 px-4">
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <input type="hidden" name="date" value={effectiveDate} />
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <StartDurationInput
                  defaultStartTime={defaultStartTime}
                  onStartTimeChange={setEnteredTime}
                />
                {nextDay && (
                  <span className="text-[10px] font-medium text-amber-500 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 shrink-0">
                    翌日
                  </span>
                )}
              </div>
              <Input
                ref={titleRef}
                name="title"
                placeholder="予定を追加..."
                className="h-8 text-sm"
                autoComplete="off"
                required
              />
              <LocationInput
                placeholder="場所"
                className="h-7 text-xs"
              />
            </div>
            <div className="flex items-center gap-1 shrink-0 pt-0.5">
              <Button
                type="submit"
                size="sm"
                className="h-8 px-3 gap-1.5 min-w-[72px]"
                disabled={pending}
              >
                {pending ? <><Spinner className="h-3.5 w-3.5" /><span>追加中</span></> : "追加"}
              </Button>
              <button
                type="button"
                onClick={onDone}
                className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
