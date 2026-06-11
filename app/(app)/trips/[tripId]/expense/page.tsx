import { Suspense } from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { expenses, expenseSplits, tripMembers, users } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AddExpenseDialog } from "@/components/expense/AddExpenseDialog";
import { ExpenseList } from "@/components/expense/ExpenseList";
import { SettlementSummary } from "@/components/expense/SettlementSummary";
import { Receipt } from "lucide-react";
import { PageLoading } from "@/components/ui/loading";

async function ExpenseContent({ tripId }: { tripId: string }) {
  const session = await auth();
  if (!session) redirect("/login");

  const [members, allExpenses] = await Promise.all([
    db
      .select({ userId: tripMembers.userId, role: tripMembers.role, name: users.name, image: users.image })
      .from(tripMembers)
      .innerJoin(users, eq(tripMembers.userId, users.id))
      .where(eq(tripMembers.tripId, tripId)),
    db.select().from(expenses).where(eq(expenses.tripId, tripId)).orderBy(expenses.createdAt),
  ]);

  const expenseIds = allExpenses.map((e) => e.id);
  const allSplits = expenseIds.length
    ? await db.select().from(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds))
    : [];

  const expensesWithSplits = allExpenses.map((e) => ({
    ...e,
    expense_splits: allSplits.filter((s) => s.expenseId === e.id),
    paidByName: members.find((m) => m.userId === e.paidBy)?.name ?? "?",
  }));

  const totalAmount = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <>
      <p className="text-sm text-gray-500 -mt-4">合計: ¥{totalAmount.toLocaleString()}</p>

      <SettlementSummary expenses={expensesWithSplits} members={members} />

      {expensesWithSplits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 min-h-[240px] gap-3">
          <Receipt size={36} className="text-gray-300 dark:text-gray-500" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-400 dark:text-gray-400">まだ費用がありません</p>
            <p className="text-xs text-gray-300 dark:text-gray-500 mt-1">右上のボタンから追加しましょう</p>
          </div>
        </div>
      ) : (
        <ExpenseList expenses={expensesWithSplits} members={members} tripId={tripId} />
      )}
    </>
  );
}

export default async function ExpensePage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const members = await db
    .select({ userId: tripMembers.userId, role: tripMembers.role, name: users.name, image: users.image })
    .from(tripMembers)
    .innerJoin(users, eq(tripMembers.userId, users.id))
    .where(eq(tripMembers.tripId, tripId));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">費用メモ</h2>
        <AddExpenseDialog tripId={tripId} members={members} currentUserId={session.user.id} />
      </div>
      <Suspense fallback={<PageLoading />}>
        <ExpenseContent tripId={tripId} />
      </Suspense>
    </div>
  );
}
