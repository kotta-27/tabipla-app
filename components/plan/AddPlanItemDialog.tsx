"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, MapPin, Calendar } from "lucide-react";
import { Spinner } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createDraftActivity, deleteDraftActivity, updateActivity } from "@/actions/plan";
import { toast } from "sonner";
import type { Memo } from "@/types";
import { StartDurationInput } from "./StartDurationInput";
import { LocationInput } from "./LocationInput";
import { ActivityMemoSection } from "./ActivityMemoSection";

export function AddPlanItemDialog({
  tripId,
  defaultDate,
  unlinkedMemos = [],
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  tripId: string;
  defaultDate?: string;
  unlinkedMemos?: Memo[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [localOpen, setLocalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen! : localOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setLocalOpen;

  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [linkedMemos, setLinkedMemos] = useState<Memo[]>([]);
  const [pending, setPending] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const isDirtyRef = useRef(false);
  const today = new Date().toISOString().slice(0, 10);

  // ダイアログを開いたらドラフト作成
  useEffect(() => {
    if (!open) return;
    isDirtyRef.current = false;
    setLinkedMemos([]);
    setDraftReady(false);
    const id = crypto.randomUUID();
    setDraftId(id);
    const date = defaultDate ?? today;
    createDraftActivity(tripId, id, date).then(() => setDraftReady(true));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMarkDirty = () => { isDirtyRef.current = true; };

  // 閉じようとした時の処理
  const handleCloseAttempt = () => {
    if (isDirtyRef.current || linkedMemos.length > 0) {
      setConfirmClose(true);
    } else {
      handleDiscard();
    }
  };

  const handleDiscard = () => {
    if (draftId) deleteDraftActivity(draftId, tripId);
    setDraftId(null);
    setConfirmClose(false);
    isDirtyRef.current = false;
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!draftId || !draftReady) return;
    const formData = new FormData(e.currentTarget);
    setPending(true);
    try {
      await updateActivity(draftId, tripId, formData);
      toast.success("プランを追加しました");
      setDraftId(null);
      isDirtyRef.current = false;
      setOpen(false);
    } catch {
      toast.error("追加に失敗しました");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleCloseAttempt(); else setOpen(true); }}>
        {!isControlled && (
          <DialogTrigger render={<Button size="sm" />}>
            <Plus size={14} />プランを追加
          </DialogTrigger>
        )}
        <DialogContent className="flex flex-col max-h-[85dvh] overflow-hidden sm:max-w-5xl" showCloseButton={false}>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0" onChange={handleMarkDirty}>
            <DialogHeader className="shrink-0 pb-2">
              <DialogTitle className="sr-only">プランを追加</DialogTitle>
              <div className="flex items-center gap-2 pr-8">
                <Input
                  name="title"
                  placeholder="タイトルを入力"
                  required
                  className="text-base font-semibold border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-sky-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleCloseAttempt}
                  className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="閉じる"
                >
                  ✕
                </button>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 min-h-0 py-2">
              {/* 日付・時間 */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="shrink-0 text-gray-400" />
                  <Input
                    name="date"
                    type="date"
                    defaultValue={defaultDate ?? today}
                    required
                    className="w-auto text-sm h-8 border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0"
                  />
                </div>
                <StartDurationInput />
              </div>

              {/* 場所 */}
              <div className="flex items-start gap-2">
                <MapPin size={14} className="shrink-0 mt-2.5 text-gray-400" />
                <LocationInput placeholder="場所を追加" className="flex-1" />
              </div>

              {/* メモ */}
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 px-3 py-2">
                <Textarea
                  name="description"
                  placeholder="メモ・備考など"
                  rows={4}
                  className="bg-transparent border-0 p-0 shadow-none resize-none text-sm text-gray-600 dark:text-gray-400 focus-visible:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                />
              </div>

              {/* メモの紐づけ */}
              {draftId && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">紐づけたメモ</p>
                  <ActivityMemoSection
                    activityId={draftId}
                    tripId={tripId}
                    linkedMemos={linkedMemos}
                    unlinkedMemos={unlinkedMemos}
                  />
                </div>
              )}
            </div>

            <div className="shrink-0 flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" variant="outline" onClick={handleCloseAttempt}>
                キャンセル
              </Button>
              <Button type="submit" className="gap-2" disabled={pending || !draftReady}>
                {pending ? <><Spinner className="h-4 w-4" />追加中</> : <><Plus size={14} />追加する</>}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 破棄確認ダイアログ */}
      <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>変更を破棄しますか？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">保存されていない内容があります。このまま閉じると破棄されます。</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmClose(false)}>
              編集を続ける
            </Button>
            <Button variant="destructive" onClick={handleDiscard}>
              破棄して閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
