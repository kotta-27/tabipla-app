"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function BackButton({ className }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={cn(
        "flex items-center justify-center h-8 w-8 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
        className
      )}
      aria-label="戻る"
    >
      <X size={18} />
    </button>
  );
}
