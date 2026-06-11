"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Suggestion {
  text: string;
  main: string;
  secondary: string;
}

interface Props {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

export function LocationInput({ name = "location", defaultValue = "", placeholder = "場所", className }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.trim().length < 1) { setSuggestions([]); setOpen(false); return; }
    const res = await fetch(`/api/places?input=${encodeURIComponent(input)}`);
    const data = await res.json();
    setSuggestions(data.suggestions ?? []);
    setOpen((data.suggestions ?? []).length > 0);
    setActiveIndex(-1);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 300);
  };

  const select = (s: Suggestion) => {
    setValue(s.text);
    setSuggestions([]);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && activeIndex >= 0) select(suggestions[activeIndex]);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        name={name}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && (
        <ul className="absolute z-50 mt-1 w-full min-w-[240px] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden text-sm">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={() => select(s)}
              className={`flex items-start gap-2 px-3 py-2 cursor-pointer transition-colors ${
                i === activeIndex
                  ? "bg-sky-50 dark:bg-sky-950"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <MapPin size={13} className="mt-0.5 shrink-0 text-sky-400" />
              <span>
                <span className="font-medium text-gray-800 dark:text-gray-100">{s.main}</span>
                {s.secondary && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">{s.secondary}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
