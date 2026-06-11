"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteExpense } from "@/actions/expense";
import { toast } from "sonner";

interface Member {
  userId: string;
  name: string | null;
}

interface Expense {
  id: string;
  description: string;
  amount: string | number;
  paidByName?: string;
  paidBy: string;
}

interface Props {
  expenses: Expense[];
  members: Member[];
  tripId: string;
}

export function ExpenseList({ expenses, members, tripId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const memberMap = Object.fromEntries(members.map((m) => [m.userId, m.name ?? "?"]));

  const handleConfirmDelete = () => {
    if (!confirmId) return;
    const id = confirmId;
    setConfirmId(null);
    startTransition(async () => {
      await deleteExpense(id, tripId);
      toast.success("削除しました");
    });
  };

  return (
    <>
      <div className="space-y-3">
        <h3 className="font-medium text-gray-700">費用一覧</h3>
        {expenses.map((expense) => (
          <Card key={expense.id} className="group">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{expense.description}</p>
                    <span className="font-bold text-sky-600">
                      ¥{Number(expense.amount).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    支払い: {expense.paidByName ?? memberMap[expense.paidBy] ?? "?"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmId(expense.id)}
                  disabled={isPending}
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                >
                  削除
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={confirmId !== null} onOpenChange={(v) => { if (!v) setConfirmId(null); }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>費用を削除しますか？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">この操作は取り消せません。</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmId(null)}>キャンセル</Button>
            <Button variant="destructive" className="flex-1" onClick={handleConfirmDelete} disabled={isPending}>削除する</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
