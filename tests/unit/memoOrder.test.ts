import { describe, it, expect } from "vitest";

// MemoSortableList から切り出した純粋関数
function sortByStoredOrder<T extends { id: string }>(items: T[], storedIds: string[]): T[] {
  const idSet = new Set(storedIds);
  const ordered = storedIds.flatMap((id) => items.filter((m) => m.id === id));
  const rest = items.filter((m) => !idSet.has(m.id));
  return [...ordered, ...rest];
}

const memos = [
  { id: "a", title: "A" },
  { id: "b", title: "B" },
  { id: "c", title: "C" },
];

describe("sortByStoredOrder", () => {
  it("保存された順番に並び替える", () => {
    const result = sortByStoredOrder(memos, ["c", "a", "b"]);
    expect(result.map((m) => m.id)).toEqual(["c", "a", "b"]);
  });

  it("保存にないIDは末尾に追加される", () => {
    const result = sortByStoredOrder(memos, ["b"]);
    expect(result.map((m) => m.id)).toEqual(["b", "a", "c"]);
  });

  it("保存IDが空の場合は元の順序を維持", () => {
    const result = sortByStoredOrder(memos, []);
    expect(result.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });

  it("保存IDに存在しないIDが含まれていても無視される", () => {
    const result = sortByStoredOrder(memos, ["z", "b", "a"]);
    expect(result.map((m) => m.id)).toEqual(["b", "a", "c"]);
  });
});
