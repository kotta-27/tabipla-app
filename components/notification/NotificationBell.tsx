"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { acceptTripInvite, dismissNotification, getNotifications } from "@/actions/notifications";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  read: boolean;
  tripId: string | null;
  tripName: string | null;
  tripEmoji: string | null;
  fromUserId: string | null;
  fromUserName: string | null;
  fromUserImage: string | null;
  pollTitle: string | null;
  createdAt: Date;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [isPending, startTransition] = useTransition();
  const [bubble, setBubble] = useState(false);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlingRef = useRef(false);
  const handledRemovedIds = useRef<Set<string>>(new Set());
  const router = useRouter();
  const panelRef = useRef<HTMLButtonElement>(null);

  const showBubble = () => {
    setBubble(true);
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => setBubble(false), 5000);
  };

  useEffect(() => {
    getNotifications().then((data) => setNotifs(data as Notification[]));

    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;
    const connect = () => {
      es = new EventSource("/api/notifications/stream");
      es.onmessage = async (e) => {
        if (e.data !== "new") return;
        if (handlingRef.current) return;
        handlingRef.current = true;
        const latest = await getNotifications() as Notification[];
        setNotifs(latest);
        const removed = latest.find((n) => n.type === "removed" && !n.read && !handledRemovedIds.current.has(n.id));
        if (removed) {
          handledRemovedIds.current.add(removed.id);
          toast.error(`${removed.tripEmoji ?? ""} ${removed.tripName ?? "トリップ"} から削除されました`, { duration: 6000 });
          router.push("/dashboard");
        } else {
          showBubble();
          router.refresh();
        }
        setTimeout(() => { handlingRef.current = false; }, 5000);
      };
      es.onerror = () => { es.close(); retryTimeout = setTimeout(connect, 5000); };
    };
    connect();
    return () => { es?.close(); clearTimeout(retryTimeout); };
  }, []);


  const unreadCount = notifs.filter((n) => !n.read).length;

  const handleAccept = (id: string) => {
    startTransition(async () => {
      const result = await acceptTripInvite(id);
      if (result?.error) { toast.error(result.error); return; }
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
      toast.success("トリップに参加しました");
      setOpen(false);
      if (result?.tripId) router.push(`/trips/${result.tripId}/poll`);
    });
  };

  const handleDismiss = (id: string) => {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    dismissNotification(id);
  };

  const [tab, setTab] = useState<"unread" | "read">("unread");
  const unread = notifs.filter((n) => !n.read);
  const read = notifs.filter((n) => n.read);
  const listed = tab === "unread" ? unread : read;

  const NotifList = () => (
    <>
      {/* タブ */}
      <div className="flex border-b shrink-0">
        <button
          type="button"
          onClick={() => setTab("unread")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === "unread" ? "border-b-2 border-sky-500 text-sky-600 dark:text-sky-400" : "text-gray-400 hover:text-gray-600"}`}
        >
          未読 {unread.length > 0 && <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1.5">{unread.length}</span>}
        </button>
        <button
          type="button"
          onClick={() => setTab("read")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === "read" ? "border-b-2 border-sky-500 text-sky-600 dark:text-sky-400" : "text-gray-400 hover:text-gray-600"}`}
        >
          既読
        </button>
      </div>
      {listed.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-gray-400">{tab === "unread" ? "未読の通知はありません" : "既読の通知はありません"}</div>
      ) : (
        <ul className="divide-y overflow-y-auto flex-1">
          {listed.map((n) => (
            <li key={n.id} className="px-4 py-3 space-y-2">
              <div className="flex items-start gap-2">
                <Avatar size="sm">
                  {n.fromUserImage && <AvatarImage src={n.fromUserImage} alt={n.fromUserName ?? ""} />}
                  <AvatarFallback>{(n.fromUserName ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  {n.type === "trip_invite" ? (
                    <p className="text-sm">
                      <span className="font-medium">{n.fromUserName ?? "ユーザー"}</span>{" "}さんから{" "}
                      {n.tripId ? (
                        <Link href={`/trips/${n.tripId}`} onClick={() => setOpen(false)} className="font-medium text-sky-600 dark:text-sky-400 hover:underline">{n.tripEmoji} {n.tripName}</Link>
                      ) : (
                        <span className="font-medium">{n.tripEmoji} {n.tripName}</span>
                      )}{" "}への招待が届いています
                    </p>
                  ) : n.type === "poll_created" ? (
                    <p className="text-sm">
                      <span className="font-medium">{n.fromUserName ?? "ユーザー"}</span>{" "}さんが{" "}
                      {n.tripId ? (
                        <Link href={`/trips/${n.tripId}/poll`} onClick={() => setOpen(false)} className="font-medium text-sky-600 dark:text-sky-400 hover:underline">「{n.pollTitle ?? "日程調整"}」</Link>
                      ) : (
                        <span className="font-medium">「{n.pollTitle ?? "日程調整"}」</span>
                      )}{" "}を作成しました。回答しましょう！
                    </p>
                  ) : n.type === "poll_answered" || n.type === "poll_updated" ? (
                    <p className="text-sm">
                      <span className="font-medium">{n.fromUserName ?? "ユーザー"}</span>{" "}さんが{" "}
                      <span className="font-medium">「{n.pollTitle ?? "日程調整"}」</span>{" "}の回答を{n.type === "poll_updated" ? "修正しました" : "完了しました"}
                    </p>
                  ) : n.type === "removed" ? (
                    <p className="text-sm">
                      <span className="font-medium">{n.tripEmoji} {n.tripName}</span>{" "}から削除されました
                    </p>
                  ) : n.type === "left" ? (
                    <p className="text-sm">
                      <span className="font-medium">{n.fromUserName ?? "ユーザー"}</span>{" "}さんが{" "}
                      {n.tripId ? (
                        <Link href={`/trips/${n.tripId}`} onClick={() => setOpen(false)} className="font-medium text-sky-600 dark:text-sky-400 hover:underline">{n.tripEmoji} {n.tripName}</Link>
                      ) : (
                        <span className="font-medium">{n.tripEmoji} {n.tripName}</span>
                      )}{" "}から脱退しました
                    </p>
                  ) : (
                    <p className="text-sm">
                      <span className="font-medium">{n.fromUserName ?? "ユーザー"}</span>{" "}さんが{" "}
                      {n.tripId ? (
                        <Link href={`/trips/${n.tripId}`} onClick={() => setOpen(false)} className="font-medium text-sky-600 dark:text-sky-400 hover:underline">{n.tripEmoji} {n.tripName}</Link>
                      ) : (
                        <span className="font-medium">{n.tripEmoji} {n.tripName}</span>
                      )}{" "}に参加しました！
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {n.tripName && n.tripId && (
                      <Link
                        href={`/trips/${n.tripId}`}
                        onClick={() => setOpen(false)}
                        className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                      >
                        {n.tripEmoji} {n.tripName}
                      </Link>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(n.createdAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
              {!n.read && (
                <div className="flex gap-2 pl-8">
                  {n.type === "trip_invite" ? (
                    <>
                      <Button size="sm" className="h-7 text-xs" onClick={() => handleAccept(n.id)} disabled={isPending}>参加する</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-gray-500" onClick={() => handleDismiss(n.id)} disabled={isPending}>無視する</Button>
                    </>
                  ) : n.type === "poll_created" && n.tripId ? (
                    <>
                      <Link href={`/trips/${n.tripId}/poll`} onClick={() => { setOpen(false); handleDismiss(n.id); }}>
                        <Button size="sm" className="h-7 text-xs" disabled={isPending}>回答する</Button>
                      </Link>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-gray-500" onClick={() => handleDismiss(n.id)} disabled={isPending}>あとで</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-gray-500" onClick={() => handleDismiss(n.id)} disabled={isPending}>既読にする</Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );

  return (
    <div className="relative flex items-center">
      {/* 吹き出し (PCのみ) */}
      <style>{`
        @keyframes bubble-pop {
          0%   { transform: scale(0.4) translateY(6px); opacity: 0; }
          55%  { transform: scale(1.12) translateY(-3px); opacity: 1; }
          75%  { transform: scale(0.96) translateY(0px); }
          90%  { transform: scale(1.03) translateY(-1px); }
          100% { transform: scale(1) translateY(0px); opacity: 1; }
        }
        @keyframes bubble-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
        .bubble-anim {
          animation:
            bubble-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
            bubble-float 2.2s ease-in-out 0.55s infinite;
        }
      `}</style>
      {bubble && (
        <div className="flex items-center -mr-[10px] sm:mr-2">
          <div className="bubble-anim relative bg-sky-500 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
            🔔 新しいお知らせがあります！
            <span className="absolute right-[-6px] top-1/2 -translate-y-1/2 border-4 border-transparent border-l-sky-500" />
          </div>
        </div>
      )}
      {/* ベルボタン */}
      <button
        ref={panelRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <>
          {/* モバイル: フルオーバーレイ */}
          <div className="sm:hidden fixed inset-0 z-[200] flex flex-col bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between px-4 py-4 border-b shrink-0">
              <p className="text-base font-semibold">通知</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NotifList />
            </div>
          </div>

          {/* デスクトップ: 背景クリックで閉じる透明レイヤー */}
          <div className="hidden sm:block fixed inset-0 z-[199]" onClick={() => setOpen(false)} />
          {/* デスクトップ: ドロップダウンパネル */}
          <div className="hidden sm:block fixed z-[200] w-80 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden"
            style={{ top: (panelRef.current?.getBoundingClientRect().bottom ?? 0) + 8, right: window.innerWidth - (panelRef.current?.getBoundingClientRect().right ?? 0) }}
          >
            <div className="px-4 py-3 border-b">
              <p className="text-sm font-semibold">通知</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <NotifList />
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
