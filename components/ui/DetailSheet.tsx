"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  children: React.ReactNode;
}

export function DetailSheet({ title, open, onOpenChange, onEdit, onDelete, isDeleting, children }: Props) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (!v) setDeleteConfirm(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex flex-col max-h-[85dvh] overflow-hidden sm:max-w-5xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-base pr-6 break-words">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {children}
        </div>

        <div className="shrink-0 flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
          {onEdit && (
            <Button variant="outline" className="gap-2" onClick={onEdit}>
              <Pencil size={14} />
              編集
            </Button>
          )}
          {onDelete && (
            !deleteConfirm ? (
              <Button
                variant="outline"
                className="gap-2 text-red-500 hover:text-red-600 hover:border-red-300"
                onClick={() => setDeleteConfirm(true)}
              >
                <Trash2 size={14} />
                削除
              </Button>
            ) : (
              <Button variant="destructive" className="gap-2" onClick={onDelete} disabled={isDeleting}>
                <Trash2 size={14} />
                本当に削除
              </Button>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
