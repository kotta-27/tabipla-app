"use client";

import { useState, useTransition } from "react";
import { MapPin, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DetailSheet } from "@/components/ui/DetailSheet";
import { LinkifiedText } from "@/components/ui/LinkifiedText";
import { deleteMemo, updateMemo, unlinkMemoFromActivity } from "@/actions/memo";
import { toast } from "sonner";
import type { Memo } from "@/types";

interface Props {
  memo: Memo;
  tripId: string;
  activityInfo?: { title: string; date: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemoDetailSheet({ memo, tripId, activityInfo, open, onOpenChange }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const activityLabel = activityInfo
    ? new Date(activityInfo.date + "T00:00:00").toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" }) +
      " " + activityInfo.title
    : null;

  const handleDelete = () => {
    startTransition(async () => {
      await deleteMemo(memo.id, tripId);
      toast.success("削除しました");
      onOpenChange(false);
    });
  };

  const handleUpdate = (formData: FormData) => {
    startTransition(async () => {
      await updateMemo(memo.id, tripId, formData);
      toast.success("保存しました");
      setEditOpen(false);
    });
  };

  const handleUnlink = () => {
    startTransition(async () => {
      await unlinkMemoFromActivity(memo.id, tripId);
      toast.success("紐づけを解除しました");
    });
  };

  return (
    <>
      <DetailSheet
        title={memo.title}
        open={open}
        onOpenChange={onOpenChange}
        onEdit={() => setEditOpen(true)}
        onDelete={handleDelete}
        isDeleting={isPending}
      >
        {activityLabel && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 px-2.5 py-1 text-xs text-sky-600 dark:text-sky-400">
            <MapPin size={11} />
            {activityLabel}
          </span>
        )}
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
          {memo.content
            ? <LinkifiedText text={memo.content} />
            : <span className="text-gray-400 italic">内容なし</span>}
        </p>
        <p className="text-xs text-gray-400">
          {new Date(memo.updatedAt).toLocaleDateString("ja-JP", {
            month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
          })} 更新
        </p>
      </DetailSheet>

      {/* 編集ダイアログ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="flex flex-col max-h-[85dvh] overflow-hidden sm:max-w-5xl">
          <form action={handleUpdate} className="flex flex-col flex-1 min-h-0 gap-4">
            <DialogHeader className="shrink-0">
              <DialogTitle className="text-base pr-6">メモを編集</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
              <div className="space-y-1.5">
                <Label>タイトル</Label>
                <Input name="title" defaultValue={memo.title} required />
              </div>
              <div className="space-y-1.5">
                <Label>内容</Label>
                <Textarea name="content" defaultValue={memo.content} rows={7} />
              </div>
              {activityLabel && (
                <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1.5">
                    <MapPin size={11} />
                    {activityLabel}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 sm:h-6 px-3 sm:px-2 text-gray-400 hover:text-red-400"
                    disabled={isPending}
                    onClick={handleUnlink}
                  >
                    紐づけを解除
                  </Button>
                </div>
              )}
            </div>
            <div className="shrink-0 flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
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
    </>
  );
}
