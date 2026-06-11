"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LinkIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/loading";
import { createTrip, joinTripByUrl } from "@/actions/trips";
import { toast } from "sonner";
import { TRIP_EMOJIS } from "@/lib/trip-emojis";



export function EmptyDashboard() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  // Create trip
  const [selectedEmoji, setSelectedEmoji] = useState("✈️");
  const [createPending, setCreatePending] = useState(false);

  const handleCreate = async (formData: FormData) => {
    setCreatePending(true);
    formData.set("cover_emoji", selectedEmoji);
    const result = await createTrip(formData);
    setCreateOpen(false);
    window.dispatchEvent(new CustomEvent("trip-created"));
    await new Promise((r) => setTimeout(r, 680));
    router.push(`/trips/${result.tripId}/poll`);
  };

  // Join trip
  const [joinInput, setJoinInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinPending, setJoinPending] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");
    setJoinPending(true);
    const result = await joinTripByUrl(joinInput);
    if (result?.error) {
      setJoinError(result.error);
      setJoinPending(false);
    } else {
      toast.success("トリップに参加しました！");
      setJoinOpen(false);
      router.push(`/trips/${result.tripId}/poll`);
    }
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-12">
      <p className="text-gray-400 dark:text-gray-600 text-sm">トリップを作成するか、招待コードで参加しましょう</p>

      <div className="flex items-center gap-10 sm:gap-16">
        {/* トリップを作成 */}
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="group flex flex-col items-center gap-3"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg group-hover:bg-sky-600 group-hover:scale-105 transition-all duration-150">
            <Plus size={36} strokeWidth={2} />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">トリップを作成</span>
        </button>

        {/* 招待URLで参加 */}
        <button
          type="button"
          onClick={() => setJoinOpen(true)}
          className="group flex flex-col items-center gap-3"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 group-hover:border-sky-400 group-hover:text-sky-500 group-hover:scale-105 transition-all duration-150">
            <LinkIcon size={30} strokeWidth={1.5} />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">招待URLで参加</span>
        </button>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新しいトリップを作成</DialogTitle>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>アイコン</Label>
              <div className="flex flex-wrap gap-2">
                {TRIP_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`text-2xl rounded-lg p-2 transition-colors ${
                      selectedEmoji === emoji ? "bg-sky-100 ring-2 ring-sky-400" : "hover:bg-gray-100"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-name">トリップ名 *</Label>
              <Input id="create-name" name="name" placeholder="例：沖縄旅行 2025" maxLength={20} required />
              <p className="text-xs text-gray-400">20文字以内</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-dest">目的地</Label>
              <Input id="create-dest" name="destination" placeholder="例：沖縄県" />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={createPending}>
              {createPending ? <><Spinner className="h-4 w-4" /><span>作成中</span></> : "作成する"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Join dialog */}
      <Dialog open={joinOpen} onOpenChange={(o) => { setJoinOpen(o); if (!o) { setJoinInput(""); setJoinError(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>招待コードで参加</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleJoin} className="space-y-4">
            <p className="text-sm text-gray-500">招待者から受け取ったコードを入力してください</p>
            <div className="space-y-2">
              <Input
                id="join-code"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
                className="font-mono text-center text-base tracking-widest h-12"
                autoComplete="off"
                spellCheck={false}
                required
              />
              {joinError && <p className="text-sm text-red-500">{joinError}</p>}
            </div>
            <Button type="submit" className="w-full gap-2" disabled={joinPending}>
              {joinPending ? <><Spinner className="h-4 w-4" /><span>参加中</span></> : "参加する"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
