"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
  type SortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Check } from "lucide-react";
import { MemoCard } from "./MemoCard";
import type { Memo } from "@/types";

// ─── 型 ──────────────────────────────────────────────────────
type StoredMemo    = { type: "memo";    id: string };
type StoredSection = { type: "section"; id: string; label: string };
type StoredItem    = StoredMemo | StoredSection;

// ─── ユーティリティ ───────────────────────────────────────────
function migrateStorage(raw: unknown): StoredItem[] {
  if (!Array.isArray(raw)) return [];
  if (typeof raw[0] === "string") return (raw as string[]).map(id => ({ type: "memo" as const, id }));
  return raw as StoredItem[];
}

function buildItems(memos: Memo[], stored: StoredItem[]): StoredItem[] {
  const storedIds = new Set(stored.filter(s => s.type === "memo").map(s => s.id));
  const serverIds = new Set(memos.map(m => m.id));
  const newMemos  = memos.filter(m => !storedIds.has(m.id)).map((m): StoredMemo => ({ type: "memo", id: m.id }));
  const filtered  = stored.filter(s => s.type === "section" || serverIds.has(s.id));
  return [...filtered, ...newMemos];
}


// ─── Props ────────────────────────────────────────────────────
interface Props {
  initialMemos: Memo[];
  tripId: string;
  activityMap: Record<string, { title: string; date: string }>;
}

// ─── SortableCard ────────────────────────────────────────────
function SortableCard({ memo, tripId, activityInfo, isDragging, isOver }: {
  memo: Memo;
  tripId: string;
  activityInfo?: { title: string; date: string };
  isDragging: boolean;
  isOver: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: memo.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative group/sortable w-full sm:w-[calc(50%-6px)] flex-none rounded-xl transition-all ${
        isOver
          ? "border-2 border-dashed border-sky-300 dark:border-sky-700 bg-sky-50/50 dark:bg-sky-950/20"
          : ""
      }`}
    >
      <div className={isDragging ? "invisible" : ""}>
        <div
          {...attributes}
          {...listeners}
          style={{ touchAction: "none" }}
          className="absolute top-1/2 -translate-y-1/2 left-2 z-10 opacity-100 sm:opacity-0 sm:group-hover/sortable:opacity-100 transition-opacity text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={20} />
        </div>
        <MemoCard memo={memo} tripId={tripId} activityInfo={activityInfo} />
      </div>
    </div>
  );
}

// ─── SortableSlot（セクション末尾の空スロット）──────────────────
function SortableSlot({ id, isOver }: { id: string; isOver: boolean }) {
  const { setNodeRef } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`w-full sm:w-[calc(50%-6px)] h-44 rounded-xl border-2 border-dashed transition-all ${
        isOver
          ? "border-sky-300 dark:border-sky-700 bg-sky-50/50 dark:bg-sky-950/20"
          : "border-transparent"
      }`}
    />
  );
}

// ─── SortableSection ─────────────────────────────────────────
function SortableSection({ section, onLabelChange, onDelete, isDragging }: {
  section: StoredSection;
  onLabelChange: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  isDragging: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(section.label);
  const inputRef              = useRef<HTMLInputElement>(null);

  const commit = () => {
    const trimmed = draft.trim() || "セクション";
    setDraft(trimmed);
    onLabelChange(section.id, trimmed);
    setEditing(false);
  };

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);
  useEffect(() => { setDraft(section.label); }, [section.label]);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`w-full flex-none transition-opacity ${isDragging ? "opacity-30" : ""}`}
    >
      <div className="group/section flex items-center gap-2 py-1">
        <div
          {...attributes}
          {...listeners}
          style={{ touchAction: "none" }}
          className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </div>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="h-0.5 flex-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={e => {
                if (e.key === "Enter")  commit();
                if (e.key === "Escape") { setDraft(section.label); setEditing(false); }
              }}
              className="text-xs font-bold text-gray-700 dark:text-gray-200 bg-transparent border-b border-sky-400 outline-none w-28 text-center"
            />
          ) : (
            <span className="text-xs font-bold tracking-widest text-gray-600 dark:text-gray-300 uppercase whitespace-nowrap select-none">
              {section.label}
            </span>
          )}
          <div className="h-0.5 flex-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity shrink-0">
          {editing ? (
            <button type="button" onClick={commit} className="p-1 text-sky-500 hover:text-sky-700">
              <Check size={13} />
            </button>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <Pencil size={13} />
            </button>
          )}
          <button type="button" onClick={() => onDelete(section.id)} className="p-1 text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MemoSortableList（メイン）────────────────────────────────
export function MemoSortableList({ initialMemos, tripId, activityMap }: Props) {
  const storageKey = `memo-order-${tripId}`;
  const memoMap    = Object.fromEntries(initialMemos.map(m => [m.id, m]));

  const [items, setItems] = useState<StoredItem[]>(() =>
    initialMemos.map(m => ({ type: "memo", id: m.id }))
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);
  const sectionDropAtEndRef = useRef(false);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (raw) setItems(buildItems(initialMemos, migrateStorage(raw)));
    } catch {}
  }, []);

  useEffect(() => {
    setItems(prev => buildItems(initialMemos, prev));
  }, [initialMemos]);

  const persist = (next: StoredItem[]) => {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  };

  // セクションドラッグ時はポインター直下の最初のアイテムを衝突先にする
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const activeId = args.active.id as string;
    const activeType = itemsRef.current.find(i => i.id === activeId)?.type;

    // カードドラッグ時: ポインターが空セクションのゾーン内にある場合はそのセクションを返す
    if (activeType !== "section") {
      const { pointerCoordinates, droppableRects } = args;
      if (pointerCoordinates) {
        const allItems = itemsRef.current;
        const sectionItems = allItems.filter(i => i.type === "section");
        for (let si = 0; si < sectionItems.length; si++) {
          const section = sectionItems[si];
          const idx = allItems.findIndex(i => i.id === section.id);
          const nextItem = allItems[idx + 1];
          const isEmpty = !nextItem || nextItem.type === "section";
          if (!isEmpty) continue;

          const sectionRect = droppableRects.get(section.id);
          if (!sectionRect) continue;

          // ゾーン: このセクションヘッダー top 〜 次のセクションヘッダー top
          const nextSection = sectionItems[si + 1];
          const nextRect = nextSection ? droppableRects.get(nextSection.id) : null;
          const zoneTop    = sectionRect.top;
          const zoneBottom = nextRect ? nextRect.top : Infinity;

          if (pointerCoordinates.y >= zoneTop && pointerCoordinates.y < zoneBottom) {
            return [{ id: section.id }];
          }
        }
      }

      // 通常のカード間 collision（セクションは除外）
      const cardArgs = {
        ...args,
        droppableContainers: args.droppableContainers.filter(
          c => itemsRef.current.find(i => i.id === c.id)?.type !== "section"
        ),
      };
      return closestCenter(cardArgs);
    }

    // セクションドラッグ: ポインター直下の最初のアイテムを衝突先にする（アクティブ除外）
    const { pointerCoordinates, droppableRects, droppableContainers } = args;
    if (!pointerCoordinates) return closestCenter(args);

    const py = pointerCoordinates.y;
    let bestId: string | null = null;
    let bestDist = Infinity;

    for (const container of droppableContainers) {
      if (container.id === activeId) continue;
      const rect = droppableRects.get(container.id);
      if (!rect) continue;
      const cy = rect.top + rect.height / 2;
      if (cy >= py) {
        const dist = cy - py;
        if (dist < bestDist) { bestDist = dist; bestId = container.id as string; }
      }
    }

    if (bestId) {
      sectionDropAtEndRef.current = false;
      return [{ id: bestId }];
    }
    // ポインターが全アイテムより下 → 末尾扱い
    sectionDropAtEndRef.current = true;
    const lastContainer = [...droppableContainers].reverse().find(c => c.id !== activeId);
    if (lastContainer) return [{ id: lastContainer.id as string }];
    return closestCenter(args);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const overIdStr = over.id as string;

    // 仮想スロット（セクション末尾の空きスロット）へのドロップ
    if (overIdStr.startsWith("slot-")) {
      const lastCardId = overIdStr.slice(5);
      setItems(prev => {
        const lastCardIdx = prev.findIndex(i => i.id === lastCardId);
        const oldIdx = prev.findIndex(i => i.id === active.id);
        if (lastCardIdx === -1 || oldIdx === -1 || oldIdx === lastCardIdx) return prev;
        const to = oldIdx < lastCardIdx ? lastCardIdx : lastCardIdx + 1;
        const next = arrayMove(prev, oldIdx, to);
        persist(next);
        return next;
      });
      return;
    }

    setItems(prev => {
      const activeItem = prev.find(i => i.id === active.id);
      const overItem   = prev.find(i => i.id === over.id);
      if (!activeItem || !overItem) return prev;

      // カードが空セクションに落とされた場合はセクション直後に挿入
      if (activeItem.type === "memo" && overItem.type === "section") {
        const sectionIdx = prev.findIndex(i => i.id === over.id);
        const oldIdx = prev.findIndex(i => i.id === active.id);
        const next = arrayMove(prev, oldIdx, sectionIdx + 1);
        persist(next);
        return next;
      }

      const oldIdx = prev.findIndex(i => i.id === active.id);
      const newIdx = prev.findIndex(i => i.id === over.id);

      // セクション移動: collision が「直下のアイテム」を返すため下方向は -1 補正。末尾は除外。
      let adjustedIdx = newIdx;
      if (activeItem.type === "section") {
        const atEnd = sectionDropAtEndRef.current;
        sectionDropAtEndRef.current = false;
        adjustedIdx = atEnd ? prev.length - 1 : (oldIdx < newIdx ? newIdx - 1 : newIdx);
      }
      if (adjustedIdx === oldIdx) return prev;

      const next = arrayMove(prev, oldIdx, adjustedIdx);
      persist(next);
      return next;
    });
  }, []);

  const addSection = () => {
    setItems(prev => {
      const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const next: StoredItem[] = [...prev, { type: "section", id, label: "セクション" }];
      persist(next);
      return next;
    });
  };

  const updateSectionLabel = (id: string, label: string) => {
    setItems(prev => {
      const next = prev.map(i => i.type === "section" && i.id === id ? { ...i, label } : i);
      persist(next);
      return next;
    });
  };

  const deleteSection = (id: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id);
      persist(next);
      return next;
    });
  };

  const [overId, setOverId] = useState<string | null>(null);

  const activeItem    = activeId ? items.find(i => i.id === activeId) : null;
  const activeMemo    = activeItem?.type === "memo" ? memoMap[activeItem.id] : null;
  const isDraggingSection = activeItem?.type === "section";

  // セクションドラッグ中はカードアニメーション無効化。カードドラッグ中はセクションアニメーション無効化。
  const noOpStrategy: SortingStrategy = () => null;
  const allIdsRef = useRef<string[]>([]);
  const cardOnlyStrategy: SortingStrategy = (args) => {
    const id = allIdsRef.current[args.index];
    const item = itemsRef.current.find(i => i.id === id);
    if (!item || item.type === "section") return null;
    return rectSortingStrategy(args);
  };
  const strategy = isDraggingSection ? noOpStrategy : cardOnlyStrategy;
  const activeSection = activeItem?.type === "section" ? (activeItem as StoredSection) : null;

  // カードドラッグ中: セクション末尾の奇数スロット ID を含めた全 ID リスト
  const isDraggingCard = !!activeId && !isDraggingSection;
  const allIds = (() => {
    const ids: string[] = [];
    let groupCardCount = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      ids.push(item.id);
      if (item.type === "section") {
        groupCardCount = 0;
      } else {
        groupCardCount++;
        const nextItem = items[i + 1];
        const isLastInGroup = !nextItem || nextItem.type === "section";
        if (isDraggingCard && isLastInGroup && groupCardCount % 2 === 1) {
          ids.push(`slot-${item.id}`);
        }
      }
    }
    return ids;
  })();
  allIdsRef.current = allIds;

  // フラットリストから行ごとにギャップ付きで要素を生成
  const renderItems = () => {
    const elements: React.ReactNode[] = [];
    let groupCardCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type === "section") {
        groupCardCount = 0;
        // セクションドラッグ中: このセクションが drop 先のとき直前に gap を表示
        if (isDraggingSection && overId === item.id && item.id !== activeId) {
          elements.push(
            <div
              key={`gap-before-section-${item.id}`}
              className="w-full h-10 rounded-xl border-2 border-dashed border-sky-400 dark:border-sky-500 bg-sky-50 dark:bg-sky-950/30 transition-all duration-150"
            />
          );
        }
        elements.push(
          <SortableSection
            key={item.id}
            section={item}
            onLabelChange={updateSectionLabel}
            onDelete={deleteSection}
            isDragging={activeId === item.id}
          />
        );
        // 空セクションにカードをドラッグしてきた時のプレースホルダー
        const isEmptySection = i === items.length - 1 || items[i + 1].type === "section";
        if (isEmptySection && isDraggingCard && overId === item.id) {
          elements.push(
            <div
              key={`empty-drop-${item.id}`}
              className="w-full sm:w-[calc(50%-6px)] h-44 rounded-xl border-2 border-dashed border-sky-300 dark:border-sky-700 bg-sky-50/50 dark:bg-sky-950/20"
            />
          );
        }
      } else {
        const memo = memoMap[item.id];
        // セクションドラッグ中のみ、行頭にギャップインジケータを挿入
        if (isDraggingSection && groupCardCount % 2 === 0) {
          const nextMemoItem = items[i + 1]?.type === "memo" ? items[i + 1] : null;
          const highlighted =
            overId === item.id || (nextMemoItem != null && overId === nextMemoItem.id);
          elements.push(
            <div
              key={`gap-${item.id}`}
              className={`w-full overflow-hidden rounded-xl border-2 border-dashed transition-all duration-150 ${
                highlighted
                  ? "h-10 border-sky-400 dark:border-sky-500 bg-sky-50 dark:bg-sky-950/30"
                  : "h-px border-transparent"
              }`}
            />
          );
        }
        if (memo) {
          elements.push(
            <SortableCard
              key={item.id}
              memo={memo}
              tripId={tripId}
              activityInfo={memo.activityId ? activityMap[memo.activityId] : undefined}
              isDragging={activeId === item.id}
              isOver={isDraggingCard && overId === item.id && activeId !== item.id}
            />
          );
        }
        groupCardCount++;

        // セクション末尾の奇数スロット
        const nextItem = items[i + 1];
        const isLastInGroup = !nextItem || nextItem.type === "section";
        if (isDraggingCard && isLastInGroup && groupCardCount % 2 === 1) {
          const slotId = `slot-${item.id}`;
          elements.push(
            <SortableSlot key={slotId} id={slotId} isOver={overId === slotId} />
          );
        }
      }
    }
    return elements;
  };

  return (
    <div className="space-y-4">
      <DndContext
        id="memo-dnd"
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={e => setActiveId(e.active.id as string)}
        onDragOver={e => setOverId(e.over?.id as string ?? null)}
        onDragEnd={e => { setOverId(null); handleDragEnd(e); }}
      >
        <SortableContext items={allIds} strategy={strategy}>
          <div className="flex flex-wrap gap-3">
            {renderItems()}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeMemo && (
            <div className="scale-[1.03] opacity-95 shadow-xl cursor-grabbing w-full sm:w-[calc(50%-6px)]">
              <MemoCard
                memo={activeMemo}
                tripId={tripId}
                activityInfo={activeMemo.activityId ? activityMap[activeMemo.activityId] : undefined}
              />
            </div>
          )}
          {activeSection && (
            <div className="flex items-center gap-2 py-1.5 px-3 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 min-w-48">
              <GripVertical size={16} className="text-gray-400 shrink-0" />
              <div className="h-0.5 flex-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              <span className="text-xs font-bold tracking-widest text-gray-600 dark:text-gray-300 uppercase whitespace-nowrap">
                {activeSection.label}
              </span>
              <div className="h-0.5 flex-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <button
        type="button"
        onClick={addSection}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 py-2 text-xs text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
      >
        + 区切りを追加
      </button>
    </div>
  );
}
