"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { EditPollDialog } from "@/components/poll/EditPollDialog";
import { submitPollResponse, deletePoll, refreshPoll, completePollResponse } from "@/actions/poll";
import { MoreVertical, Pencil, Trash2, ClipboardList, Circle, Triangle, X, Loader2, Columns3, AlignJustify } from "lucide-react";
import { toast } from "sonner";

const RESPONSE_OPTIONS = [
  { value: "ok" as const, icon: Circle, active: "bg-green-500 text-white border-green-500", idle: "bg-white text-green-600 border-green-300 hover:bg-green-50" },
  { value: "maybe" as const, icon: Triangle, active: "bg-yellow-400 text-white border-yellow-400", idle: "bg-white text-yellow-600 border-yellow-300 hover:bg-yellow-50" },
  { value: "ng" as const, icon: X, active: "bg-red-500 text-white border-red-500", idle: "bg-white text-red-500 border-red-300 hover:bg-red-50" },
];

const BADGE: Record<string, string> = {
  ok: "bg-green-100 text-green-700",
  maybe: "bg-yellow-100 text-yellow-700",
  ng: "bg-red-100 text-red-700",
};
const BADGE_ICON: Record<string, typeof Circle> = { ok: Circle, maybe: Triangle, ng: X };

interface PollResponse { id: string; dateId: string; userId: string; response: string; }
interface PollDate { id: string; date: string; poll_responses: PollResponse[]; }
interface Poll { id: string; title: string; description: string | null; poll_dates: PollDate[]; }
interface Member { userId: string; name: string | null; image: string | null; }
interface Props { poll: Poll; members: Member[]; currentUserId: string; tripId: string; isOwner: boolean; }

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("ja-JP", {
    month: "numeric", day: "numeric", weekday: "short",
  });
}

export function PollGrid({ poll, members, currentUserId, tripId, isOwner }: Props) {
  const [isPending, startTransition] = useTransition();
  const [answering, setAnswering] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [viewMode, setViewMode] = useState<"by-person" | "by-date">("by-person");

  useEffect(() => {
    const saved = localStorage.getItem("poll-view-mode") as "by-person" | "by-date" | null;
    if (saved) setViewMode(saved);
  }, []);

  const handleViewMode = (mode: "by-person" | "by-date") => {
    setViewMode(mode);
    localStorage.setItem("poll-view-mode", mode);
  };
  const [editOpen, setEditOpen] = useState(false);

  const sortedDates = [...(poll.poll_dates ?? [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  type ResponseVal = "ok" | "maybe" | "ng";

  const buildResponses = () => {
    const m: Record<string, ResponseVal> = {};
    for (const d of sortedDates) {
      const r = d.poll_responses.find((r) => r.userId === currentUserId)?.response;
      if (r) m[d.id] = r as ResponseVal;
    }
    return m;
  };

  // サーバーから来た確定済み回答
  const [myResponses, setMyResponses] = useState<Record<string, ResponseVal>>(buildResponses);
  // ダイアログ内の編集中回答（完了前は送信しない）
  const [draftResponses, setDraftResponses] = useState<Record<string, ResponseVal>>({});

  // 完了後のrevalidateでサーバーデータが来たら同期
  useEffect(() => {
    setMyResponses(buildResponses());
  }, [poll]);

  const openAnswering = () => {
    setDraftResponses({ ...myResponses });
    setAnswering(true);
  };

  const isDirty = answering && sortedDates.some((d) => draftResponses[d.id] !== myResponses[d.id]);

  const getResponse = (dateId: string, userId: string) => {
    if (userId === currentUserId) return myResponses[dateId];
    return poll.poll_dates.find((d) => d.id === dateId)
      ?.poll_responses.find((r) => r.userId === userId)?.response;
  };

  const getOkCount = (dateId: string) => {
    const othersOk = poll.poll_dates.find((d) => d.id === dateId)
      ?.poll_responses.filter((r) => r.userId !== currentUserId && r.response === "ok").length ?? 0;
    return othersOk + (myResponses[dateId] === "ok" ? 1 : 0);
  };

  const hasMyAnswer = sortedDates.some((d) => myResponses[d.id]);

  // スコアリング: ○=2, △=1, ✕=-1, 未回答=0
  const getScore = (dateId: string) => {
    return members.reduce((sum, m) => {
      const res = getResponse(dateId, m.userId);
      if (res === "ok") return sum + 2;
      if (res === "maybe") return sum + 1;
      if (res === "ng") return sum - 1;
      return sum;
    }, 0);
  };

  const scores = sortedDates.map((d) => ({ id: d.id, score: getScore(d.id) }));
  const maxScore = Math.max(...scores.map((s) => s.score), 0);
  const bestDateIds = new Set(
    maxScore > 0 ? scores.filter((s) => s.score === maxScore).map((s) => s.id) : []
  );

  const handleDraftResponse = (dateId: string, response: ResponseVal) => {
    setDraftResponses((s) => {
      if (s[dateId] === response) {
        const next = { ...s };
        delete next[dateId];
        return next;
      }
      return { ...s, [dateId]: response };
    });
  };

  const handleComplete = () => {
    const isEdit = hasMyAnswer;
    setMyResponses({ ...draftResponses });
    startTransition(async () => {
      await Promise.all(
        sortedDates
          .filter((d) => draftResponses[d.id])
          .map((d) => submitPollResponse(poll.id, d.id, draftResponses[d.id], tripId))
      );
      await completePollResponse(poll.id, tripId);
      refreshPoll(tripId);
      setAnswering(false);
      toast.success(isEdit ? "回答を修正しました" : "回答を完了しました");
    });
  };

  const handleCloseAttempt = () => {
    if (isDirty) {
      setConfirmClose(true);
    } else {
      setAnswering(false);
    }
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deletePoll(poll.id, tripId);
      toast.success("ポールを削除しました");
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{poll.title}</CardTitle>
            {poll.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{poll.description}</p>
            )}
          </div>
          <div className="flex items-center">
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
                }>
                  <MoreVertical size={16} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil size={14} />
                    編集
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)} disabled={isPending}>
                    <Trash2 size={14} />
                    削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <EditPollDialog
              pollId={poll.id}
              tripId={tripId}
              initialTitle={poll.title}
              initialDescription={poll.description}
              initialDates={sortedDates.map((d) => d.date)}
              open={editOpen}
              onOpenChange={setEditOpen}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 表示切替 */}
        <div className="flex justify-end">
          <div className="inline-flex rounded-md border overflow-hidden">
            <button
              type="button"
              onClick={() => handleViewMode("by-person")}
              title="人 → 日付"
              className={`px-2.5 py-1.5 transition-colors ${viewMode === "by-person" ? "bg-sky-50 text-sky-600" : "text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
            >
              <Columns3 size={15} />
            </button>
            <button
              type="button"
              onClick={() => handleViewMode("by-date")}
              title="日付 → 人"
              className={`px-2.5 py-1.5 border-l transition-colors ${viewMode === "by-date" ? "bg-sky-50 text-sky-600" : "text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
            >
              <AlignJustify size={15} />
            </button>
          </div>
        </div>

        {/* 閲覧テーブル */}
        <div className="overflow-x-auto">
          {viewMode === "by-person" ? (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-4 font-medium text-gray-400 dark:text-gray-500 text-xs min-w-[90px]">メンバー</th>
                  {sortedDates.map((d) => {
                    const isBest = bestDateIds.has(d.id);
                    return (
                      <th key={d.id} className={`text-center py-2 px-2 min-w-[64px] rounded-t ${isBest ? "bg-green-50 dark:bg-green-950/40" : ""}`}>
                        <div className={`text-xs whitespace-nowrap font-semibold ${isBest ? "text-green-700 dark:text-green-300" : "text-gray-500 font-normal"}`}>
                          {formatDate(d.date)}
                        </div>
                        <div className="flex items-center justify-center gap-0.5 text-xs text-green-600 dark:text-green-400 font-normal mt-0.5"><Circle size={9} strokeWidth={2.5} /> {getOkCount(d.id)}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const isMe = m.userId === currentUserId;
                  return (
                    <tr key={m.userId} className="border-t">
                      <td className={`py-2 pr-4 text-sm ${isMe ? "font-semibold text-sky-600" : "text-gray-700 dark:text-gray-200"}`}>
                        {m.name ?? "ユーザー"}
                      </td>
                      {sortedDates.map((d) => {
                        const res = getResponse(d.id, m.userId);
                        const isBest = bestDateIds.has(d.id);
                        return (
                          <td key={d.id} className={`py-2 px-2 text-center ${isBest ? "bg-green-50 dark:bg-green-950/40" : ""}`}>
                            {res ? (
                              <span className={`inline-flex h-7 w-7 items-center justify-center rounded ${BADGE[res]}`}>
                                {(() => { const Icon = BADGE_ICON[res]; return <Icon size={13} strokeWidth={2.5} />; })()}
                              </span>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-4 font-medium text-gray-400 dark:text-gray-500 text-xs min-w-[90px]">日付</th>
                  {members.map((m) => {
                    const isMe = m.userId === currentUserId;
                    return (
                      <th key={m.userId} className={`text-center py-2 px-2 min-w-[64px] text-xs whitespace-nowrap ${isMe ? "text-sky-600 font-semibold" : "text-gray-500 font-medium"}`}>
                        {m.name ?? "ユーザー"}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedDates.map((d) => {
                  const isBest = bestDateIds.has(d.id);
                  return (
                  <tr key={d.id} className={`border-t ${isBest ? "bg-green-50 dark:bg-green-950/40" : ""}`}>
                    <td className="py-2 pr-4 text-xs whitespace-nowrap">
                      <div className={isBest ? "text-green-700 dark:text-green-300 font-semibold" : "text-gray-500 dark:text-gray-400"}>{formatDate(d.date)}</div>
                      <div className="flex items-center gap-0.5 text-green-600 dark:text-green-400 mt-0.5"><Circle size={9} strokeWidth={2.5} /> {getOkCount(d.id)}</div>
                    </td>
                    {members.map((m) => {
                      const res = getResponse(d.id, m.userId);
                      return (
                        <td key={m.userId} className="py-2 px-2 text-center">
                          {res ? (
                            <span className={`inline-flex h-7 w-7 items-center justify-center rounded ${BADGE[res]}`}>
                              {(() => { const Icon = BADGE_ICON[res]; return <Icon size={13} strokeWidth={2.5} />; })()}
                            </span>
                          ) : (
                            <span className="text-gray-200 text-xs">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 回答ボタン */}
        <div className="border-t pt-3 flex justify-end">
          <Button
            variant={hasMyAnswer ? "outline" : "default"}
            className="w-full sm:w-auto sm:text-xs sm:h-8 sm:px-3"
            onClick={openAnswering}
          >
            {hasMyAnswer ? <><Pencil size={14} />回答を編集する</> : <><ClipboardList size={14} />回答する</>}
          </Button>
        </div>

        {/* 回答ダイアログ */}
        <Dialog open={answering} onOpenChange={(v) => { if (!v) handleCloseAttempt(); }}>
          <DialogContent className="max-w-sm sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>回答する</DialogTitle>
            </DialogHeader>
            <div className="overflow-x-auto">
              <div className="flex gap-4 min-w-max pb-1">
                {sortedDates.map((d) => {
                  const myRes = draftResponses[d.id];
                  return (
                    <div key={d.id} className="flex flex-col items-center gap-2">
                      <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(d.date)}</span>
                      <div className="flex flex-col gap-1.5">
                        {RESPONSE_OPTIONS.map((opt) => {
                          const isActive = myRes === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleDraftResponse(d.id, opt.value)}
                              className={`h-9 w-11 rounded border flex items-center justify-center transition-all ${isActive ? opt.active : opt.idle}`}
                            >
                              <opt.icon size={15} strokeWidth={2.5} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <Button className="w-full mt-2 gap-2" onClick={handleComplete} disabled={isPending}>
              {isPending ? <><Loader2 size={14} className="animate-spin" />保存中...</> : "完了"}
            </Button>
          </DialogContent>
        </Dialog>

        {/* ポール削除確認ダイアログ */}
        <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>ポールを削除しますか？</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-500 dark:text-gray-400">この操作は取り消せません。</p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>キャンセル</Button>
              <Button variant="destructive" className="flex-1" disabled={isPending} onClick={() => { setConfirmDelete(false); handleDelete(); }}>削除する</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 変更を破棄して閉じる確認ダイアログ */}
        <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
          <DialogContent className="max-w-xs" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>変更が反映されません</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-500 dark:text-gray-400">「完了」を押さずに閉じると、変更内容は保存されません。よろしいですか？</p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmClose(false)}>
                戻る
              </Button>
              <Button variant="outline" className="flex-1 text-red-500 border-red-200 hover:bg-red-50" onClick={() => {
                setConfirmClose(false);
                setAnswering(false);
              }}>
                閉じる
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
