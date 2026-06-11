import { describe, it, expect } from "vitest";
import { calcSettlements } from "@/lib/settlement";

const members = ["alice", "bob", "carol"];

function expense(paidBy: string, amount: number, splitAmong: string[]) {
  const share = amount / splitAmong.length;
  return {
    paidBy,
    amount,
    expense_splits: splitAmong.map((userId) => ({ userId, shareAmount: share })),
  };
}

describe("calcSettlements", () => {
  it("精算不要 — 全員が均等に支払った場合", () => {
    const expenses = [
      expense("alice", 3000, members),
      expense("bob", 3000, members),
      expense("carol", 3000, members),
    ];
    expect(calcSettlements(expenses, members)).toHaveLength(0);
  });

  it("2人の場合 — 一方が全額払った", () => {
    const expenses = [expense("alice", 6000, ["alice", "bob"])];
    const result = calcSettlements(expenses, ["alice", "bob"]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ from: "bob", to: "alice", amount: 3000 });
  });

  it("3人の場合 — 1人が全額、均等割り", () => {
    const expenses = [expense("alice", 9000, members)];
    const result = calcSettlements(expenses, members);

    expect(result).toHaveLength(2);
    const total = result.reduce((s, r) => s + r.amount, 0);
    expect(total).toBe(6000); // bob + carol それぞれ 3000
    result.forEach((r) => expect(r.to).toBe("alice"));
  });

  it("複数支払い — 最小振込回数に最適化される", () => {
    // alice: 6000払い → 2000受け取るべき
    // bob:   3000払い → 1000受け取るべき
    // carol: 0払い   → 3000支払うべき
    const expenses = [
      expense("alice", 6000, members),
      expense("bob", 3000, members),
    ];
    const result = calcSettlements(expenses, members);

    const carolPayments = result.filter((r) => r.from === "carol");
    const totalCarolPays = carolPayments.reduce((s, r) => s + r.amount, 0);
    expect(totalCarolPays).toBe(3000);
  });

  it("費用がない場合は空配列", () => {
    expect(calcSettlements([], members)).toHaveLength(0);
  });

  it("金額が文字列でも正しく計算できる", () => {
    const expenses = [
      { paidBy: "alice", amount: "3000", expense_splits: [{ userId: "bob", shareAmount: "1500" }] },
    ];
    const result = calcSettlements(expenses, ["alice", "bob"]);
    expect(result[0]).toMatchObject({ from: "bob", to: "alice", amount: 1500 });
  });
});
