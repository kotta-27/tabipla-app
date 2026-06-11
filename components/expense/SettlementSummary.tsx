"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, Check, ArrowRight } from "lucide-react";
import { calcSettlements } from "@/lib/settlement";

interface Member {
  userId: string;
  name: string | null;
}

interface Split {
  userId: string;
  shareAmount: string | number;
}

interface Expense {
  id: string;
  paidBy: string;
  amount: string | number;
  expense_splits: Split[];
}

interface Props {
  expenses: Expense[];
  members: Member[];
}

export function SettlementSummary({ expenses, members }: Props) {
  if (expenses.length === 0) return null;

  const memberMap = Object.fromEntries(members.map((m) => [m.userId, m.name ?? "?"]));
  const settlements = calcSettlements(expenses, members.map((m) => m.userId));

  return (
    <Card className="bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
          <Banknote size={14} />精算サマリー
        </CardTitle>
      </CardHeader>
      <CardContent>
        {settlements.length === 0 ? (
          <p className="text-sm text-sky-600 dark:text-sky-400 flex items-center gap-1">
            <Check size={14} />精算は不要です
          </p>
        ) : (
          <ul className="space-y-2">
            {settlements.map((s, i) => (
              <li key={i} className="text-sm flex items-center gap-2">
                <span className="font-medium">{memberMap[s.from] ?? "?"}</span>
                <ArrowRight size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
                <span className="font-medium">{memberMap[s.to] ?? "?"}</span>
                <span className="ml-auto font-bold text-sky-700 dark:text-sky-400">¥{s.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
