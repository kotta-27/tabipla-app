"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/loading";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateTrip, deleteTrip, leaveTrip, removeTripMember } from "@/actions/trips";
import { toast } from "sonner";
import { TRIP_EMOJIS } from "@/lib/trip-emojis";
import { Trash2, LogOut, UserMinus } from "lucide-react";
import { InviteButton } from "@/components/trip/InviteButton";



interface Member {
  userId: string;
  name: string | null;
  image: string | null;
  role: string;
}

interface Props {
  tripId: string;
  initialName: string;
  initialDestination: string | null;
  initialEmoji: string;
  members: Member[];
  currentUserId: string;
  isOwner: boolean;
}

export function TripSettingsForm({
  tripId,
  initialName,
  initialDestination,
  initialEmoji,
  members,
  currentUserId,
  isOwner,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedEmoji, setSelectedEmoji] = useState(initialEmoji);
  const [name, setName] = useState(initialName);
  const [destination, setDestination] = useState(initialDestination ?? "");
  const [confirmDialog, setConfirmDialog] = useState<
    | { type: "delete" }
    | { type: "leave" }
    | { type: "removeMember"; userId: string; name: string | null }
    | null
  >(null);

  const handleSave = (formData: FormData) => {
    formData.set("cover_emoji", selectedEmoji);
    startTransition(async () => {
      await updateTrip(tripId, formData);
      toast.success("設定を保存しました");
    });
  };

  const handleConfirm = () => {
    if (!confirmDialog) return;
    const dialog = confirmDialog;
    setConfirmDialog(null);
    startTransition(async () => {
      if (dialog.type === "delete") {
        await deleteTrip(tripId);
      } else if (dialog.type === "leave") {
        await leaveTrip(tripId);
      } else if (dialog.type === "removeMember") {
        await removeTripMember(tripId, dialog.userId);
        toast.success("メンバーを削除しました");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* トリップ情報 */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">トリップ情報</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label>アイコン</Label>
                <div className="relative">
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1 max-h-[135px] overflow-y-auto overscroll-contain">
                    {TRIP_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSelectedEmoji(emoji)}
                        className={`flex items-center justify-center h-10 w-full text-2xl rounded-lg transition-colors ${
                          selectedEmoji === emoji
                            ? "bg-sky-100 ring-2 ring-sky-400"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
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
                <Label htmlFor="name">トリップ名 *</Label>
                <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value.slice(0, 20))} maxLength={20} required />
                <p className="text-xs text-gray-400">20文字以内</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">目的地</Label>
                <Input id="destination" name="destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="例：沖縄県" />
              </div>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? <><Spinner className="h-4 w-4" />保存中</> : "保存する"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* メンバー */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">メンバー ({members.length}人)</CardTitle>
            <InviteButton tripId={tripId} />
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 px-4">
            {members.map((m) => (
              <li key={m.userId} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Avatar size="sm" className={m.role === "owner" ? "!ring-sky-400 ring-2" : ""}>
                    {m.image && <AvatarImage src={m.image} alt={m.name ?? ""} />}
                    <AvatarFallback>{(m.name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{m.name ?? "ユーザー"}</p>
                    <p className="text-xs text-gray-400">{m.role === "owner" ? "オーナー" : "メンバー"}</p>
                  </div>
                </div>
                {isOwner && m.userId !== currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-600 h-10 w-10 sm:h-8 sm:w-auto sm:px-2 p-0"
                    onClick={() => setConfirmDialog({ type: "removeMember", userId: m.userId, name: m.name })}
                    disabled={isPending}
                  >
                    <UserMinus size={15} />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 危険ゾーン */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-base text-red-600">危険な操作</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isOwner ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">トリップを削除</p>
                <p className="text-xs text-gray-400">すべてのデータが削除されます。取り消せません。</p>
              </div>
              <Button
                variant="outline"
                className="text-red-500 border-red-300 hover:bg-red-50 gap-1.5"
                onClick={() => setConfirmDialog({ type: "delete" })}
                disabled={isPending}
              >
                <Trash2 size={14} />削除
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">トリップから脱退</p>
                <p className="text-xs text-gray-400">脱退後は再招待が必要です。</p>
              </div>
              <Button
                variant="outline"
                className="text-red-500 border-red-300 hover:bg-red-50 gap-1.5"
                onClick={() => setConfirmDialog({ type: "leave" })}
                disabled={isPending}
              >
                <LogOut size={14} />脱退
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {/* 確認ダイアログ */}
      <Dialog open={confirmDialog !== null} onOpenChange={(open) => { if (!open) setConfirmDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog?.type === "delete" && "トリップを削除しますか？"}
              {confirmDialog?.type === "leave" && "トリップから脱退しますか？"}
              {confirmDialog?.type === "removeMember" && `${confirmDialog.name ?? "このユーザー"}を削除しますか？`}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 mt-1">
            {confirmDialog?.type === "delete" && "すべてのデータが削除されます。この操作は取り消せません。"}
            {confirmDialog?.type === "leave" && "脱退後は再招待が必要です。"}
            {confirmDialog?.type === "removeMember" && "このメンバーはトリップにアクセスできなくなります。"}
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isPending}
              className="gap-1.5"
            >
              {confirmDialog?.type === "delete" && <><Trash2 size={14} />削除する</>}
              {confirmDialog?.type === "leave" && <><LogOut size={14} />脱退する</>}
              {confirmDialog?.type === "removeMember" && <><UserMinus size={14} />削除する</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
