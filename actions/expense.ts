"use server";

import { db } from "@/lib/db";
import { expenses, expenseSplits } from "@/lib/schema";
import { requireAuth, requireTripMember } from "@/lib/auth-helpers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createExpense(tripId: string, formData: FormData) {
  const user = await requireAuth();
  await requireTripMember(user.id, tripId);

  const description = formData.get("description") as string;
  const amount = formData.get("amount") as string;
  const paidBy = formData.get("paid_by") as string;
  const splitUserIds = formData.getAll("split_users") as string[];

  const [expense] = await db
    .insert(expenses)
    .values({ tripId, description, amount, paidBy })
    .returning();

  if (splitUserIds.length > 0) {
    const shareAmount = (
      Math.round((parseFloat(amount) / splitUserIds.length) * 100) / 100
    ).toString();

    await db.insert(expenseSplits).values(
      splitUserIds.map((userId) => ({
        expenseId: expense.id,
        userId,
        shareAmount,
      }))
    );
  }

  revalidatePath(`/trips/${tripId}/expense`);
}

export async function deleteExpense(id: string, tripId: string) {
  const user = await requireAuth();
  await requireTripMember(user.id, tripId);
  await db.delete(expenses).where(eq(expenses.id, id));
  revalidatePath(`/trips/${tripId}/expense`);
}
