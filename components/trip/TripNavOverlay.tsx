"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Plane } from "lucide-react";
import {
  easeInOut,
  easeIn,
  LAYERS,
  drawLayer,
  drawSpray,
  drawFoam,
  drawCaustics,
  spawnDroplets,
  drawDroplets,
  type Droplet,
} from "./waveEngine";

const ENTER_MS    = 750;
const MIN_HOLD_MS = 2500; // minimum hold after the wave covers the screen — 演出をしっかり見せる
const MAX_HOLD_MS = 8000; // fallback if navigation never completes
const EXIT_MS     = 650;

const PHRASES = [
  "さあ、行こう",
  "忘れ物ない？",
  "いざ、出発",
  "準備はいい？",
];

interface TripInfo {
  emoji?: string;
  name?: string;
}

const BUBBLES = [
  { left: "16%", size: 10, duration: 3.2, delay: 0.2 },
  { left: "28%", size: 6,  duration: 2.6, delay: 1.1 },
  { left: "44%", size: 14, duration: 3.8, delay: 0.6 },
  { left: "58%", size: 8,  duration: 2.9, delay: 1.6 },
  { left: "72%", size: 12, duration: 3.4, delay: 0.0 },
  { left: "86%", size: 7,  duration: 2.7, delay: 0.9 },
];

export function TripNavOverlay() {
  const [info, setInfo] = useState<TripInfo | null>(null);
  const [submerged, setSubmerged] = useState(false); // wave covers screen → show content
  const [exiting, setExiting] = useState(false);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const rafRef       = useRef<number>(0);
  const startRef     = useRef<number>(0);
  const exitWantedRef = useRef(false);
  const exitStartRef  = useRef<number | null>(null);
  const dropsRef     = useRef<Droplet[]>([]);
  const phraseRef    = useRef(PHRASES[0]);
  const pathname     = usePathname();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<TripInfo>).detail ?? {};
      phraseRef.current = PHRASES[Math.floor(Math.random() * PHRASES.length)];
      exitWantedRef.current = false;
      setInfo(detail);
      setSubmerged(false);
      setExiting(false);
    };
    window.addEventListener("trip-navigate", handler);
    return () => window.removeEventListener("trip-navigate", handler);
  }, []);

  // pathname が変わったら遷移完了 → 波を引かせる
  useEffect(() => {
    exitWantedRef.current = true;
  }, [pathname]);

  useEffect(() => {
    if (!info) return;

    exitStartRef.current = null;
    dropsRef.current = [];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    startRef.current = performance.now();
    let lastNow = startRef.current;

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const dt = Math.min((now - lastNow) * 0.001, 0.05);
      lastNow = now;

      // 遷移完了（or タイムアウト）後、最低ホールドを守って退場開始
      if (exitStartRef.current === null) {
        if (exitWantedRef.current) {
          exitStartRef.current = Math.max(elapsed, ENTER_MS + MIN_HOLD_MS);
        } else if (elapsed >= ENTER_MS + MAX_HOLD_MS) {
          exitStartRef.current = elapsed;
        }
      }

      const exitStart = exitStartRef.current;
      const totalMs = exitStart !== null ? exitStart + EXIT_MS : Infinity;

      if (elapsed >= totalMs) {
        setInfo(null);
        return;
      }

      const t = elapsed * 0.001;

      let fill: number;
      let foamAlpha = 1;

      if (elapsed < ENTER_MS) {
        fill = easeInOut(elapsed / ENTER_MS);
      } else if (exitStart === null || elapsed < exitStart) {
        fill = 1;
        setSubmerged(true);
      } else {
        const p = (elapsed - exitStart) / EXIT_MS;
        fill      = 1 - easeIn(p);
        foamAlpha = Math.max(0, 1 - p * 2.5);
        setExiting(true);
      }

      // fillY: center of wave motion. fill=0→below screen, fill=1→above screen
      const fillY = H + 60 - fill * (H + 120);

      ctx.clearRect(0, 0, W, H);

      for (const layer of LAYERS) {
        drawLayer(ctx, W, H, fillY, t, layer);
      }
      drawCaustics(ctx, W, H, fillY, t, fill);
      drawFoam(ctx, W, fillY, t, foamAlpha);
      drawSpray(ctx, W, fillY, t, foamAlpha);
      if (foamAlpha > 0.2) spawnDroplets(dropsRef.current, W, fillY, t);
      drawDroplets(ctx, dropsRef.current, dt, foamAlpha);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [info]);

  if (!info) return null;

  return (
    <div className="fixed inset-0 z-[9998] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ pointerEvents: "none" }}
      />

      {/* 水中コンテンツ：波が画面を覆ったら出現 */}
      {submerged && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: exiting ? 0 : 1,
            transform: exiting ? "translateY(-28px)" : "translateY(0)",
            transition: "opacity 0.4s ease-in, transform 0.45s ease-in",
          }}
        >
          {/* 深度ビネット：白文字のコントラスト確保 */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(7,55,92,0.78) 0%, rgba(7,55,92,0.45) 45%, transparent 72%)",
            }}
          />

          {/* 立ちのぼる泡 */}
          {BUBBLES.map((b, i) => (
            <div
              key={i}
              className="absolute bottom-[-24px] rounded-full border border-white/30 bg-white/10"
              style={{
                left: b.left,
                width: b.size,
                height: b.size,
                animation: `trip-bubble ${b.duration}s ease-in ${b.delay}s infinite`,
              }}
            />
          ))}

          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* 発光リング + スタンプ登場する絵文字 */}
            <div className="relative flex items-center justify-center">
              <div
                className="absolute h-32 w-32 rounded-full border border-white/30"
                style={{ animation: "trip-ring-pulse 2.2s ease-out 0.3s infinite" }}
              />
              <div
                className="absolute h-32 w-32 rounded-full border border-white/20"
                style={{ animation: "trip-ring-pulse 2.2s ease-out 1.1s infinite" }}
              />
              <div
                className="flex h-28 w-28 items-center justify-center rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 60%, transparent 75%)",
                  animation: "trip-stamp 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
                }}
              >
                <div style={{ animation: "trip-hover 2.8s ease-in-out 0.7s infinite" }}>
                  {info.emoji ? (
                    <span className="select-none text-6xl leading-none drop-shadow-lg">
                      {info.emoji}
                    </span>
                  ) : (
                    <Plane
                      size={52}
                      strokeWidth={1.5}
                      className="-rotate-[30deg] text-white drop-shadow-lg"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-center">
              <p
                className="text-[10px] uppercase tracking-[0.55em] text-sky-100/50"
                style={{ animation: "trip-fade-up 0.5s ease-out 0.15s both" }}
              >
                Journey Begins
              </p>
              {/* 一文字ずつ浮かび上がるフレーズ */}
              <p className="text-xl font-semibold tracking-[0.3em] text-white">
                {[...phraseRef.current].map((ch, i) => (
                  <span
                    key={i}
                    className="inline-block"
                    style={{
                      animation: `trip-letter 0.45s cubic-bezier(0.22,0.61,0.36,1) ${0.2 + i * 0.06}s both`,
                    }}
                  >
                    {ch}
                  </span>
                ))}
              </p>
              {info.name && (
                <p
                  className="text-sm text-sky-100/70"
                  style={{ animation: "trip-fade-up 0.5s ease-out 0.5s both" }}
                >
                  {info.name}
                </p>
              )}
            </div>

            {/* 航海プログレス */}
            <div
              className="flex flex-col items-center gap-2"
              style={{ animation: "trip-fade-up 0.5s ease-out 0.65s both" }}
            >
              <div className="relative h-5 w-52">
                <div className="absolute top-1/2 h-0 w-full -translate-y-1/2 border-t border-dashed border-white/30" />
                <div className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white/50" />
                <div className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-sky-300" />
                <div
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ animation: "trip-boarding 2.4s ease-in-out infinite" }}
                >
                  <Plane size={15} strokeWidth={2} className="rotate-45 text-white drop-shadow" />
                </div>
              </div>
              <p
                className="font-mono text-[9px] font-semibold tracking-[0.35em] text-sky-200/70"
                style={{ animation: "trip-blink 1.6s ease-in-out infinite" }}
              >
                NOW BOARDING
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
