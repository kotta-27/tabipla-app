"use client";

import { useRouter } from "next/navigation";

interface Props {
  href: string;
  emoji?: string;
  name?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function TripNavLink({ href, emoji, name, className, style, children }: Props) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(
      new CustomEvent("trip-navigate", { detail: { emoji, name } })
    );
    // 波が画面を覆ってから遷移（ENTER_MS = 750ms に合わせる）
    setTimeout(() => router.push(href), 750);
  };

  return (
    <a href={href} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  );
}
