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
import { createExpense } from "@/actions/expense";
import { useControlledDialog } from "@/hooks/useControlledDialog";
import { toast } from "sonner";

interface Member {
  userId: string;
  name: string | null;
  role: string;
}

interface Props {
  tripId: string;
  members: Member[];
  currentUserId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddExpenseDialog({ tripId, members, currentUserId, open: controlledOpen, onOpenChange }: Props) {
  const { open, setOpen, isControlled } = useControlledDialog(controlledOpen, onOpenChange);
  const [isPending, startTransition] = useTransition();
  const [doSplit, setDoSplit] = useState(false);
  const [selectedSplitUsers, setSelectedSplitUsers] = useState<string[]>(members.map((m) => m.userId));
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [formKey, setFormKey] = useState(0);

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setDoSplit(false);
      setSelectedSplitUsers(members.map((m) => m.userId));
      setPaidBy(currentUserId);
      setFormKey((k) => k + 1);
    }
    setOpen(v);
  };

  const toggleUser = (userId: string) => {
    setSelectedSplitUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const splitUsers = doSplit ? selectedSplitUsers : [paidBy];
    if (splitUsers.length === 0) {
      toast.error("割り勘する人を選択してください");
      return;
    }
    const formData = new FormData(e.currentTarget);
    splitUsers.forEach((id) => formData.append("split_users", id));
    startTransition(async () => {
      await createExpense(tripId, formData);
      toast.success("費用を追加しました");
      handleOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger render={<AddButton label="費用を追加" />} />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>費用を追加</DialogTitle>
        </DialogHeader>
        <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">内容 *</Label>
            <Input id="description" name="description" placeholder="例：夕食代、交通費" required disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">金額 (円) *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="1"
              placeholder="例：5000"
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paid_by">支払った人 *</Label>
            <select
              id="paid_by"
              name="paid_by"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
              required
              disabled={isPending}
            >
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name ?? "ユーザー"}
                  {m.userId === currentUserId ? "（あなた）" : ""}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={doSplit}
              onChange={(e) => setDoSplit(e.target.checked)}
              className="rounded"
              disabled={isPending}
            />
            <span className="text-sm font-medium">割り勘する</span>
          </label>

          {doSplit && (
            <div className="space-y-2 pl-1">
              <Label className="text-xs text-gray-500">割り勘する人</Label>
              <div className="space-y-2">
                {members.map((m) => (
                  <label key={m.userId} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSplitUsers.includes(m.userId)}
                      onChange={() => toggleUser(m.userId)}
                      className="rounded"
                      disabled={isPending}
                    />
                    <span className="text-sm">
                      {m.name ?? "ユーザー"}
                      {m.userId === currentUserId ? "（あなた）" : ""}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full gap-2" disabled={isPending}>
            {isPending ? <><Spinner className="h-4 w-4" /><span>追加中</span></> : "追加する"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
