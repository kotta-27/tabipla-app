"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, Plus } from "lucide-react";
import { createTrip } from "@/actions/trips";
import { toast } from "sonner";
import { TRIP_EMOJIS } from "@/lib/trip-emojis";

export default function CreateTripDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState("✈️");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setPending(true);
    formData.set("cover_emoji", selectedEmoji);

    try {
      const result = await createTrip(formData);
      // 作成完了 → ダイアログ閉じて波アニメーション起動、波の上昇中に遷移
      setOpen(false);
      window.dispatchEvent(new CustomEvent("trip-created"));
      await new Promise((r) => setTimeout(r, 400));
      router.push(`/trips/${result.tripId}/poll`);
    } catch {
      toast.error("作成に失敗しました");
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!pending) setOpen(v); }}>
      <DialogTrigger render={<Button />}>
        <Plus size={14} /><span className="hidden sm:inline">トリップを作成</span><span className="sm:hidden">作成</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新しいトリップを作成</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}>
          <div className="space-y-2">
            <Label>アイコン</Label>
            <div className="flex flex-wrap gap-2">
              {TRIP_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`text-2xl rounded-lg p-2 transition-colors ${
                    selectedEmoji === emoji
                      ? "bg-sky-100 ring-2 ring-sky-400"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">トリップ名 *</Label>
            <Input id="name" name="name" placeholder="例：沖縄旅行 2025" maxLength={20} required disabled={pending} />
            <p className="text-xs text-gray-400">20文字以内</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination">目的地</Label>
            <Input id="destination" name="destination" placeholder="例：沖縄県" disabled={pending} />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                作成中…
              </>
            ) : "作成する"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
