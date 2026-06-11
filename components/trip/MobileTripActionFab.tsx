"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, LinkIcon, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/loading";
import { createTrip, joinTripByUrl } from "@/actions/trips";
import { TRIP_EMOJIS } from "@/lib/trip-emojis";
import { toast } from "sonner";

type Screen = "select" | "create" | "join";



export function MobileTripActionFab() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>("select");

  // create state
  const [selectedEmoji, setSelectedEmoji] = useState("✈️");
  const [createPending, setCreatePending] = useState(false);

  // join state
  const [joinInput, setJoinInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinPending, setJoinPending] = useState(false);

  const handleClose = () => {
    setOpen(false);
    setScreen("select");
    setJoinInput("");
    setJoinError("");
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setCreatePending(true);
    formData.set("cover_emoji", selectedEmoji);
    try {
      const result = await createTrip(formData);
      setOpen(false);
      window.dispatchEvent(new CustomEvent("trip-created"));
      await new Promise((r) => setTimeout(r, 400));
      router.push(`/trips/${result.tripId}/poll`);
    } catch {
      toast.error("作成に失敗しました");
      setCreatePending(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");
    setJoinPending(true);
    const result = await joinTripByUrl(joinInput);
    if (result.error) {
      setJoinError(result.error);
      setJoinPending(false);
      return;
    }
    toast.success("トリップに参加しました");
    handleClose();
    router.push(`/trips/${result.tripId}/poll`);
  };

  const title =
    screen === "create" ? "新しいトリップを作成" :
    screen === "join"   ? "招待コードで参加" :
    "トリップを追加";

  return (
    <>
      {/* + button — mobile only */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sm:hidden w-9 h-9 rounded-full bg-sky-500 text-white shadow flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus size={20} />
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!createPending && !joinPending) handleClose(); if (v) setOpen(true); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          {screen === "select" && (
            <div className="flex flex-col gap-3 pt-1">
              <button
                type="button"
                onClick={() => setScreen("create")}
                className="flex items-center gap-4 rounded-xl border-2 border-gray-100 px-4 py-4 text-left hover:border-sky-200 hover:bg-sky-50 transition-colors active:scale-[0.98]"
              >
                <div className="w-11 h-11 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                  <Sparkles size={22} className="text-sky-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm">新規作成</p>
                  <p className="text-xs text-gray-400 mt-0.5">新しいトリップをはじめる</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScreen("join")}
                className="flex items-center gap-4 rounded-xl border-2 border-gray-100 px-4 py-4 text-left hover:border-sky-200 hover:bg-sky-50 transition-colors active:scale-[0.98]"
              >
                <div className="w-11 h-11 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                  <LinkIcon size={20} className="text-sky-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm">招待コードで参加</p>
                  <p className="text-xs text-gray-400 mt-0.5">招待リンクからトリップに参加</p>
                </div>
              </button>
            </div>
          )}

          {screen === "create" && (
            <form onSubmit={handleCreate} className="space-y-4" onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}>
              <div className="space-y-2">
                <Label>アイコン</Label>
                <div className="relative py-2">
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1 max-h-[135px] overflow-y-auto overscroll-contain py-2">
                    {TRIP_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSelectedEmoji(emoji)}
                        className={`flex items-center justify-center h-10 w-full text-2xl rounded-lg transition-colors ${
                          selectedEmoji === emoji ? "bg-sky-100 ring-2 ring-sky-400" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fab-name">トリップ名 *</Label>
                <Input id="fab-name" name="name" placeholder="例：沖縄旅行 2025" maxLength={20} required disabled={createPending} />
                <p className="text-xs text-gray-400">20文字以内</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fab-dest">目的地</Label>
                <Input id="fab-dest" name="destination" placeholder="例：沖縄県" disabled={createPending} />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" disabled={createPending} onClick={() => setScreen("select")}>
                  <X size={14} />
                  戻る
                </Button>
                <Button type="submit" className="flex-1" disabled={createPending}>
                  {createPending ? <><Loader2 size={15} className="animate-spin" />作成中…</> : "作成する"}
                </Button>
              </div>
            </form>
          )}

          {screen === "join" && (
            <form onSubmit={handleJoin} className="space-y-4">
              <p className="text-sm text-gray-500">招待者から受け取ったコードを入力してください</p>
              <Input
                value={joinInput}
                onChange={(e) => { setJoinInput(e.target.value.toUpperCase()); setJoinError(""); }}
                placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
                className="font-mono text-center text-sm tracking-widest h-12"
                autoComplete="off"
                spellCheck={false}
                autoFocus
              />
              {joinError && <p className="text-sm text-red-500">{joinError}</p>}
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setScreen("select")}>
                  <X size={14} />
                  戻る
                </Button>
                <Button type="submit" className="flex-1 gap-2" disabled={joinPending || !joinInput.trim()}>
                  {joinPending ? <><Spinner className="h-4 w-4" /><span>参加中</span></> : "参加する"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
