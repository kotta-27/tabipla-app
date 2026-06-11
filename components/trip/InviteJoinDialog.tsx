"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { acceptInvite, declineInvite } from "@/actions/trips";
import { Plane } from "lucide-react";
import { Spinner } from "@/components/ui/loading";
import { TripTicketCard } from "./TripTicketCard";

interface InviteJoinDialogProps {
  token: string;
  tripId: string;
  tripName: string;
  tripEmoji: string;
  tripDestination: string | null;
  inviterName: string;
  inviterImage: string | null;
}

export function InviteJoinDialog({
  token,
  tripId,
  tripName,
  tripEmoji,
  tripDestination,
  inviterName,
  inviterImage,
}: InviteJoinDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<"accept" | "decline" | null>(null);

  const handleAccept = () => {
    setAction("accept");
    startTransition(async () => {
      const result = await acceptInvite(token);
      if ("error" in result) { setAction(null); return; }

      setOpen(false);
      window.dispatchEvent(
        new CustomEvent("trip-navigate", { detail: { emoji: tripEmoji, name: tripName } })
      );
      router.push(`/trips/${result.tripId}/poll`);
    });
  };

  const handleDecline = () => {
    setAction("decline");
    startTransition(async () => {
      await declineInvite(token);
      setOpen(false);
      router.replace("/dashboard");
    });
  };

  // 保留: 通知を送らず閉じるだけ
  const handleHold = () => {
    setOpen(false);
    router.replace("/dashboard");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !isPending) handleHold(); }}>
      <DialogContent className="max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>トリップへの招待</DialogTitle>
        </DialogHeader>

        {/* Avatar + Ticket */}
        <div className="flex items-center justify-center gap-5 py-3">
          {/* 招待者アバター */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <Avatar className="size-14 text-lg">
              {inviterImage && <AvatarImage src={inviterImage} alt={inviterName} />}
              <AvatarFallback>{inviterName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 max-w-[72px] truncate">{inviterName}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">さんから招待</p>
            </div>
          </div>

          {/* チケット（少し右に傾ける） */}
          <div style={{ rotate: "8deg", transformOrigin: "bottom center" }} className="drop-shadow-xl">
            <TripTicketCard
              tripId={tripId}
              tripName={tripName}
              tripEmoji={tripEmoji}
              tripDestination={tripDestination}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <Button variant="outline" onClick={handleDecline} disabled={isPending} className="flex-1 gap-2 rounded-full text-gray-500">
              {action === "decline" && <Spinner className="h-4 w-4" />}
              断る
            </Button>
            <Button onClick={handleAccept} disabled={isPending} className="flex-1 gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 shadow-md shadow-sky-300/50 dark:shadow-sky-900/50 hover:from-sky-600 hover:to-blue-700">
              {action === "accept" ? <Spinner className="h-4 w-4" /> : <Plane size={15} />}
              参加する
            </Button>
          </div>
          <Button variant="ghost" onClick={handleHold} disabled={isPending} className="w-full rounded-full text-gray-400">
            保留する
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
