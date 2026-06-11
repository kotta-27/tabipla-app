"use client";

import { useState, useTransition } from "react";
import { Spinner } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { AddButton } from "@/components/ui/AddButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/DatePicker";
import { createPoll } from "@/actions/poll";
import { toast } from "sonner";

export function CreatePollDialog({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false);
  const [dates, setDates] = useState<string[]>([]);
  const [notify, setNotify] = useState(true);
  const [formKey, setFormKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (v: boolean) => {
    if (!v) { setDates([]); setNotify(true); setFormKey((k) => k + 1); }
    setOpen(v);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (dates.length === 0) {
      toast.error("候補日を1つ以上選択してください");
      return;
    }
    const formData = new FormData(e.currentTarget);
    dates.forEach((d) => formData.append("dates", d));
    formData.set("notify", notify ? "1" : "0");
    startTransition(async () => {
      await createPoll(tripId, formData);
      toast.success("日程調整を作成しました");
      handleOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<AddButton label="日程を調整する" />} />
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>日程調整ポールを作成</DialogTitle>
        </DialogHeader>
        <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル *</Label>
            <Input id="title" name="title" placeholder="例：旅行の日程" required disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Input id="description" name="description" placeholder="任意のメモ" disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label>候補日 *</Label>
            <div className="rounded-lg border p-3">
              <DatePicker value={dates} onChange={setDates} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              disabled={isPending}
              className="h-4 w-4 rounded border-input accent-sky-600"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">参加者に通知する</span>
          </label>
          <Button type="submit" className="w-full gap-2" disabled={isPending}>
            {isPending ? <><Spinner className="h-4 w-4" /><span>作成中</span></> : "作成する"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
