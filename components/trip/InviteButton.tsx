"use client";

import { useState } from "react";
import { UserPlus, Link as LinkIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createInviteToken, sendTripInviteToUser } from "@/actions/trips";
import { Badge } from "@/components/ui/badge";
import { getPastCoTravelers } from "@/actions/notifications";
import { toast } from "sonner";

interface CoTraveler {
  userId: string;
  name: string | null;
  image: string | null;
  pendingInvite: boolean;
}

export function InviteButton({ tripId }: { tripId: string }) {
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [coTravelers, setCoTravelers] = useState<CoTraveler[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const [inviteCode, setInviteCode] = useState("");

  const openUrlDialog = async () => {
    setUrlDialogOpen(true);
    if (!inviteUrl) {
      setUrlLoading(true);
      const result = await createInviteToken(tripId);
      if (result.token) {
        setInviteUrl(`${window.location.origin}/join/${result.token}`);
        // 8文字ずつ4グループで表示
        const t = result.token;
        setInviteCode([t.slice(0,8), t.slice(8,16), t.slice(16,24), t.slice(24,32)].join("-").toUpperCase());
      }
      setUrlLoading(false);
    }
  };

  const openUserDialog = async () => {
    setUserDialogOpen(true);
    setUsersLoading(true);
    const travelers = await getPastCoTravelers(tripId);
    setCoTravelers(travelers);
    setUsersLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success("招待コードをコピーしました");
  };

  const handleInvite = async (toUserId: string) => {
    setSending(toUserId);
    const result = await sendTripInviteToUser(tripId, toUserId);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("招待を送りました");
      setCoTravelers((prev) =>
        prev.map((u) => u.userId === toUserId ? { ...u, pendingInvite: true } : u)
      );
    }
    setSending(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
          <UserPlus size={15} />招待
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={openUrlDialog}>
            <LinkIcon size={14} />
            URLで招待
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={openUserDialog}>
            <Users size={14} />
            ユーザを招待
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* URL招待ダイアログ */}
      <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>招待コードで招待</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">このコードをメンバーに共有してください</p>
            {urlLoading ? (
              <div className="text-sm text-gray-400">コードを生成中...</div>
            ) : (
              <>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-4 text-center">
                  <p className="font-mono text-xl font-bold tracking-widest text-gray-800 dark:text-gray-100 select-all">
                    {inviteCode}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCopy} className="flex-1">コードをコピー</Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { navigator.clipboard.writeText(inviteUrl); toast.success("URLをコピーしました"); }}
                  >
                    URLをコピー
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ユーザー招待ダイアログ */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ユーザを招待</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">同じトリップに参加したことがあるメンバーを招待できます</p>
            {usersLoading ? (
              <div className="text-sm text-gray-400">読み込み中...</div>
            ) : coTravelers.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center text-gray-400">
                <Users size={32} className="mb-2" />
                <p className="text-sm">招待できるユーザーがいません</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {coTravelers.map((u) => (
                  <li key={u.userId} className="flex items-center justify-between gap-3 py-1">
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        {u.image && <AvatarImage src={u.image} alt={u.name ?? ""} />}
                        <AvatarFallback>{(u.name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{u.name ?? "ユーザー"}</span>
                    </div>
                    {u.pendingInvite ? (
                      <Badge variant="secondary" className="text-xs">招待中</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInvite(u.userId)}
                        disabled={sending === u.userId}
                      >
                        {sending === u.userId ? "送信中..." : "招待する"}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
