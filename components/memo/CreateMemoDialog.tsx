"use client";

import { useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { createMemo } from "@/actions/memo";
import { useControlledDialog } from "@/hooks/useControlledDialog";
import { toast } from "sonner";

interface Props {
  tripId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateMemoDialog({ tripId, open: controlledOpen, onOpenChange }: Props) {
  const { open, setOpen, isControlled } = useControlledDialog(controlledOpen, onOpenChange);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createMemo(tripId, formData);
      toast.success("メモを追加しました");
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger render={<AddButton label="メモを追加" />} />
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>メモを追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル *</Label>
            <Input id="title" name="title" placeholder="例：持ち物リスト" required disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">内容</Label>
            <Textarea id="content" name="content" placeholder="メモの内容を入力..." rows={6} disabled={isPending} />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={isPending}>
            {isPending ? <><Spinner className="h-4 w-4" /><span>追加中</span></> : "追加する"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
