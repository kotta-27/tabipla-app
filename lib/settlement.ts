export interface Split {
  userId: string;
  shareAmount: string | number;
}

export interface ExpenseRecord {
  paidBy: string;
  amount: string | number;
  expense_splits: Split[];
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export function calcSettlements(expenses: ExpenseRecord[], memberIds: string[]): Settlement[] {
  const balances: Record<string, number> = {};
  memberIds.forEach((id) => (balances[id] = 0));

  for (const expense of expenses) {
    balances[expense.paidBy] = (balances[expense.paidBy] ?? 0) + Number(expense.amount);
    for (const split of expense.expense_splits ?? []) {
      balances[split.userId] = (balances[split.userId] ?? 0) - Number(split.shareAmount);
    }
  }

  const settlements: Settlement[] = [];
  const debtors = Object.entries(balances)
    .filter(([, b]) => b < 0)
    .map(([id, b]) => ({ id, amount: -b }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = Object.entries(balances)
    .filter(([, b]) => b > 0)
    .map(([id, b]) => ({ id, amount: b }))
    .sort((a, b) => b.amount - a.amount);

  let di = 0, ci = 0;
  while (di < debtors.length && ci < creditors.length) {
    const settle = Math.min(debtors[di].amount, creditors[ci].amount);
    if (settle > 0.5) {
      settlements.push({ from: debtors[di].id, to: creditors[ci].id, amount: Math.round(settle) });
    }
    debtors[di].amount -= settle;
    creditors[ci].amount -= settle;
    if (debtors[di].amount < 0.5) di++;
    if (creditors[ci].amount < 0.5) ci++;
  }

  return settlements;
}
