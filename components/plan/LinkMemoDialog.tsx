"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createMemo, linkMemoToActivity } from "@/actions/memo";
import { StickyNote } from "lucide-react";
import { toast } from "sonner";
import type { Memo } from "@/types";

interface Props {
  activityId: string;
  tripId: string;
  unlinkedMemos: Memo[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkMemoDialog({ activityId, tripId, unlinkedMemos, open, onOpenChange }: Props) {
  const [tab, setTab] = useState<"new" | "existing">("new");
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (formData: FormData) => {
    formData.set("activityId", activityId);
    startTransition(async () => {
      await createMemo(tripId, formData);
      toast.success("メモを作成しました");
      onOpenChange(false);
    });
  };

  const handleLink = () => {
    if (!selectedMemoId) return;
    startTransition(async () => {
      await linkMemoToActivity(selectedMemoId, activityId, tripId);
      toast.success("メモを紐づけました");
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>メモを紐づける</DialogTitle>
        </DialogHeader>

        {/* タブ切替 */}
        <div className="flex rounded-lg border overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => setTab("new")}
            className={`flex-1 py-1.5 transition-colors ${tab === "new" ? "bg-sky-50 text-sky-600 font-medium" : "text-gray-500 hover:bg-gray-50"}`}
          >
            新規作成
          </button>
          <button
            type="button"
            onClick={() => setTab("existing")}
            className={`flex-1 py-1.5 border-l transition-colors ${tab === "existing" ? "bg-sky-50 text-sky-600 font-medium" : "text-gray-500 hover:bg-gray-50"}`}
          >
            既存を選択 {unlinkedMemos.length > 0 && `(${unlinkedMemos.length})`}
          </button>
        </div>

        {tab === "new" ? (
          <form action={handleCreate} className="space-y-3">
            <div className="space-y-1">
              <Label>タイトル</Label>
              <Input name="title" required placeholder="メモのタイトル" />
            </div>
            <div className="space-y-1">
              <Label>内容</Label>
              <Textarea name="content" rows={4} placeholder="メモの内容（任意）" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "作成中..." : "作成して紐づける"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {unlinkedMemos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <StickyNote size={28} className="text-gray-300" />
                <p className="text-sm text-gray-400">紐づけ可能なメモがありません</p>
                <p className="text-xs text-gray-300">「新規作成」タブから作成してください</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {unlinkedMemos.map((memo) => (
                  <button
                    key={memo.id}
                    type="button"
                    onClick={() => setSelectedMemoId(memo.id)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                      selectedMemoId === memo.id
                        ? "border-sky-400 bg-sky-50 dark:bg-sky-950"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <p className="text-sm font-medium truncate">{memo.title}</p>
                    {memo.content && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{memo.content}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!selectedMemoId || isPending}
                onClick={handleLink}
              >
                {isPending ? "紐づけ中..." : "紐づける"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
