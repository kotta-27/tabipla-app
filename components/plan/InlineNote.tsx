"use client";

import { useState, useRef, useEffect } from "react";
import { StickyNote } from "lucide-react";
import { Spinner } from "@/components/ui/loading";
import { updateActivityNote } from "@/actions/plan";

interface Props {
  activityId: string;
  tripId: string;
  value: string | null;
}

export function InlineNote({ activityId, tripId, value }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [text, setText] = useState(value ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(value ?? "");
  }, [value]);

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
      const el = textareaRef.current;
      if (el) el.selectionStart = el.selectionEnd = el.value.length;
    }
  }, [editing]);

  const save = async () => {
    setEditing(false);
    const next = text.trim() || null;
    if (next === (value?.trim() || null)) return;
    setSaving(true);
    await updateActivityNote(activityId, tripId, next);
    setSaving(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      setText(value ?? "");
      setEditing(false);
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      save();
    }
  };

  if (editing) {
    return (
      <div className="mt-1.5">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="メモを入力... (Cmd+Enterで保存、Escでキャンセル)"
          className="w-full text-xs text-gray-600 dark:text-gray-400 bg-sky-50/60 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded px-2 py-1.5 resize-none outline-none focus:border-sky-400 dark:focus:border-sky-600 transition-colors placeholder:text-gray-300 dark:placeholder:text-gray-600"
        />
      </div>
    );
  }

  if (saving) {
    return (
      <div className="mt-2 flex items-center gap-1.5 rounded bg-gray-50 dark:bg-gray-800/50 px-2.5 py-1.5 text-xs text-gray-400 dark:text-gray-500">
        <Spinner className="h-3 w-3" />
        反映中...
      </div>
    );
  }

  if (value) {
    return (
      <div
        onClick={() => setEditing(true)}
        className="mt-2 flex items-start gap-1.5 rounded bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 cursor-pointer"
        title="クリックしてメモを編集"
      >
        <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
          {value}
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="mt-2 hidden sm:flex w-full items-center gap-1.5 rounded border border-dashed border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <StickyNote size={11} />
      <span>メモを追加</span>
    </button>
  );
}
