"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/loading";
import { joinTripByUrl } from "@/actions/trips";
import { toast } from "sonner";

export function JoinByUrlDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);

    const result = await joinTripByUrl(input);

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    toast.success("トリップに参加しました");
    setOpen(false);
    setInput("");
    router.push(`/trips/${result.tripId}/poll`);
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) { setInput(""); setError(""); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" />}>
        <LinkIcon size={15} />
        <span className="hidden sm:inline">招待コードで参加</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>招待コードで参加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-500">招待者から受け取ったコードを入力してください</p>
          <div className="space-y-2">
            <Input
              id="invite-code"
              value={input}
              onChange={(e) => { setInput(e.target.value.toUpperCase()); setError(""); }}
              placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
              className="font-mono text-center text-base tracking-widest h-12"
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <Button type="submit" className="w-full gap-2" disabled={pending || !input.trim()}>
            {pending ? <><Spinner className="h-4 w-4" /><span>参加中...</span></> : "参加する"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
