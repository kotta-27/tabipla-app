"use client";

import { useState } from "react";
import { Spinner } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
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
import { updatePoll } from "@/actions/poll";
import { toast } from "sonner";

interface Props {
  pollId: string;
  tripId: string;
  initialTitle: string;
  initialDescription: string | null;
  initialDates: string[];
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

export function EditPollDialog({
  pollId,
  tripId,
  initialTitle,
  initialDescription,
  initialDates,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [dates, setDates] = useState<string[]>(initialDates);
  const [pending, setPending] = useState(false);

  const handleOpen = (v: boolean) => {
    if (v) setDates(initialDates);
    controlledOnOpenChange ? controlledOnOpenChange(v) : setInternalOpen(v);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (dates.length === 0) {
      toast.error("候補日を1つ以上選択してください");
      return;
    }
    const formData = new FormData(e.currentTarget);
    dates.forEach((d) => formData.append("dates", d));
    setPending(true);
    try {
      await updatePoll(pollId, tripId, formData);
      toast.success("ポールを更新しました");
      handleOpen(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      {!controlledOnOpenChange && (
        <DialogTrigger render={<Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-800" />}>
          編集
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ポールを編集</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">タイトル *</Label>
            <Input
              id="edit-title"
              name="title"
              defaultValue={initialTitle}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">説明</Label>
            <Input
              id="edit-description"
              name="description"
              defaultValue={initialDescription ?? ""}
              placeholder="任意のメモ"
            />
          </div>
          <div className="space-y-2">
            <Label>候補日 *</Label>
            <p className="text-xs text-amber-600">
              ※ 削除した日付の回答データも消えます
            </p>
            <div className="rounded-lg border p-3">
              <DatePicker value={dates} onChange={setDates} />
            </div>
          </div>
          <Button type="submit" className="w-full gap-2" disabled={pending}>
            {pending ? <><Spinner className="h-4 w-4" /><span>更新中</span></> : "更新する"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
