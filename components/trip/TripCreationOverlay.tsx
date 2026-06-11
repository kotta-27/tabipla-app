"use client";

import { useEffect, useRef, useState } from "react";
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

const ENTER_MS   = 900;
const MIN_HOLD_MS = 400;  // minimum hold even if page loads instantly
const MAX_HOLD_MS = 4000; // fallback if page never signals ready
const EXIT_MS    = 700;

export function TripCreationOverlay() {
  const [active, setActive] = useState(false);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number>(0);
  const startRef    = useRef<number>(0);
  const exitStartRef = useRef<number | null>(null); // null = not yet triggered
  const dropsRef    = useRef<Droplet[]>([]);

  useEffect(() => {
    const handler = () => setActive(true);
    window.addEventListener("trip-created", handler);
    return () => window.removeEventListener("trip-created", handler);
  }, []);

  useEffect(() => {
    if (!active) return;

    exitStartRef.current = null;
    dropsRef.current = [];

    const onReady = () => {
      const elapsed = performance.now() - startRef.current;
      // respect minimum hold time after wave fully covers screen
      const minExit = ENTER_MS + MIN_HOLD_MS;
      exitStartRef.current = Math.max(elapsed, minExit);
    };
    window.addEventListener("trip-page-ready", onReady, { once: true });

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

      // Fallback: force exit if page never signals ready
      if (exitStartRef.current === null && elapsed >= ENTER_MS + MAX_HOLD_MS) {
        exitStartRef.current = elapsed;
      }

      const exitStart = exitStartRef.current;
      const totalMs = exitStart !== null ? exitStart + EXIT_MS : Infinity;

      if (elapsed >= totalMs) {
        setActive(false);
        window.removeEventListener("trip-page-ready", onReady);
        return;
      }

      const t = elapsed * 0.001;

      let fill: number;
      let foamAlpha = 1;

      if (elapsed < ENTER_MS) {
        fill = easeInOut(elapsed / ENTER_MS);
      } else if (exitStart === null || elapsed < exitStart) {
        fill = 1;
      } else {
        const p = (elapsed - exitStart) / EXIT_MS;
        fill      = 1 - easeIn(p);
        foamAlpha = Math.max(0, 1 - p * 2.5);
      }

      // fillY: center of wave motion. fill=0→below screen, fill=1→above screen
      const fillY = H + 60 - fill * (H + 120);

      ctx.clearRect(0, 0, W, H);

      // Wave body layers (back → front)
      for (const layer of LAYERS) {
        drawLayer(ctx, W, H, fillY, t, layer);
      }

      // Subsurface caustic shimmer
      drawCaustics(ctx, W, H, fillY, t, fill);

      // Foam lines on surface
      drawFoam(ctx, W, fillY, t, foamAlpha);

      // Spray / mist above the crest (white leading edge)
      drawSpray(ctx, W, fillY, t, foamAlpha);

      // Flying spray droplets off the crests
      if (foamAlpha > 0.2) spawnDroplets(dropsRef.current, W, fillY, t);
      drawDroplets(ctx, dropsRef.current, dt, foamAlpha);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("trip-page-ready", onReady);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    />
  );
}
