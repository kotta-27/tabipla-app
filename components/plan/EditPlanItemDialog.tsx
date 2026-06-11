"use client";

import { useTransition } from "react";
import { MapPin, Pencil, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateActivity } from "@/actions/plan";
import { toast } from "sonner";
import type { Activity } from "@/lib/plan-utils";
import type { Memo } from "@/types";
import { StartDurationInput } from "./StartDurationInput";
import { LocationInput } from "./LocationInput";
import { ActivityMemoSection } from "./ActivityMemoSection";

interface Props {
  tripId: string;
  item: Activity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkedMemos?: Memo[];
  unlinkedMemos?: Memo[];
}

export function EditPlanItemDialog({ tripId, item, open, onOpenChange, linkedMemos = [], unlinkedMemos = [] }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    onOpenChange(false);
    startTransition(async () => {
      try {
        await updateActivity(item.id, tripId, formData);
        toast.success("プランを更新しました");
      } catch {
        toast.error("保存に失敗しました");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[85dvh] overflow-hidden sm:max-w-5xl">
        <form action={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <DialogHeader className="shrink-0 pb-2">
            <DialogTitle className="sr-only">プランを編集</DialogTitle>
            <Input
              name="title"
              defaultValue={item.title}
              placeholder="タイトル"
              required
              className="text-base font-semibold border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-sky-400 transition-colors pr-8"
            />
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 min-h-0 py-2">
            {/* 日付・時間（同一行） */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="shrink-0 text-gray-400" />
                <Input
                  name="date"
                  type="date"
                  defaultValue={item.date}
                  required
                  className="w-auto text-sm h-8 border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <StartDurationInput
                initialStartTime={item.startTime}
                initialEndTime={item.endTime}
              />
            </div>

            {/* 場所 */}
            <div className="flex items-start gap-2">
              <MapPin size={14} className="shrink-0 mt-2.5 text-gray-400" />
              <LocationInput
                placeholder="場所を追加"
                defaultValue={item.location ?? ""}
                className="flex-1"
              />
            </div>

            {/* メモ */}
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 px-3 py-2">
              <Textarea
                name="description"
                placeholder="メモ・備考など"
                defaultValue={item.description ?? ""}
                rows={4}
                className="bg-transparent border-0 p-0 shadow-none resize-none text-sm text-gray-600 dark:text-gray-400 focus-visible:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
            </div>

            {/* メモの紐づけ */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">紐づけたメモ</p>
              <ActivityMemoSection
                activityId={item.id}
                tripId={tripId}
                linkedMemos={linkedMemos}
                unlinkedMemos={unlinkedMemos}
              />
            </div>
          </div>

          <div className="shrink-0 flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" className="gap-2" disabled={isPending}>
              <Pencil size={14} />
              保存する
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
