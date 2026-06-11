export function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
export function easeIn(t: number) {
  return t * t * t;
}

interface WaveOctave {
  amp: number;
  freq: number;
  phase: number;
  speed: number;
  /** phase-warp strength: 0 = pure sine, higher = sharper crests / flatter troughs */
  chop: number;
}

interface WaveLayer {
  /** gradient: [crest color, deep color] */
  crest: string;
  deep: string;
  yOff: number;
  /** slow swell: amplitude pulses over time */
  swellFreq: number;
  swellPhase: number;
  octaves: WaveOctave[];
}

export const LAYERS: WaveLayer[] = [
  // deepest — deep ocean: long slow swell, almost no chop
  {
    crest: "#0c4a6e", deep: "#0a2a6e", yOff: 60, swellFreq: 0.45, swellPhase: 0,
    octaves: [
      { amp: 20, freq: 0.008, phase: 0,             speed:  1.3, chop: 0.2 },
      { amp:  7, freq: 0.021, phase: 2.1,           speed: -1.9, chop: 0.0 },
    ],
  },
  // mid — royal blue
  {
    crest: "#0369a1", deep: "#0d3a8c", yOff: 36, swellFreq: 0.55, swellPhase: 1.7,
    octaves: [
      { amp: 24, freq: 0.013, phase: Math.PI * 0.6, speed: -1.8, chop: 0.45 },
      { amp:  9, freq: 0.031, phase: 0.8,           speed:  2.6, chop: 0.2 },
    ],
  },
  // surface — teal: choppier, more detail
  {
    crest: "#38bdf8", deep: "#0369a1", yOff: 12, swellFreq: 0.65, swellPhase: 3.4,
    octaves: [
      { amp: 20, freq: 0.017, phase: Math.PI * 1.2, speed:  2.3, chop: 0.7 },
      { amp:  8, freq: 0.041, phase: 4.2,           speed: -3.1, chop: 0.3 },
      { amp:  3, freq: 0.090, phase: 1.1,           speed:  4.4, chop: 0.0 },
    ],
  },
  // leading crest — pale sky fading to teal: sharpest, fastest
  {
    crest: "#e0f7ff", deep: "#7dd3fc", yOff: -4, swellFreq: 0.8, swellPhase: 5.0,
    octaves: [
      { amp: 15, freq: 0.023, phase: Math.PI * 0.3, speed: -2.8, chop: 0.9 },
      { amp:  6, freq: 0.052, phase: 2.7,           speed:  3.7, chop: 0.4 },
      { amp: 2.5, freq: 0.110, phase: 0.4,          speed: -5.2, chop: 0.0 },
    ],
  },
];

const FRONT = LAYERS[3];

/** Wave displacement at x. Phase-warped sine → trochoid-like sharp crests. */
function octaveAt(x: number, t: number, o: WaveOctave) {
  const th = o.freq * x + t * o.speed + o.phase;
  // negative warp pushes peaks up into sharp crests (canvas y-down: crest = -1)
  return o.amp * Math.sin(th - o.chop * Math.sin(th));
}

function surfaceAt(x: number, t: number, layer: WaveLayer) {
  const swell = 1 + 0.22 * Math.sin(t * layer.swellFreq + layer.swellPhase);
  let y = 0;
  for (const o of layer.octaves) y += octaveAt(x, t, o);
  return y * swell;
}

export function drawLayer(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  fillY: number, t: number,
  layer: WaveLayer,
) {
  const topY = fillY + layer.yOff;

  // Rich vertical gradient: crest → deep ocean
  const grad = ctx.createLinearGradient(0, topY, 0, H);
  grad.addColorStop(0,   layer.crest);
  grad.addColorStop(0.2, layer.deep);
  grad.addColorStop(1,   layer.deep);

  ctx.beginPath();
  ctx.moveTo(-2, H + 2);
  for (let x = -2; x <= W + 2; x += 3) {
    ctx.lineTo(x, topY + surfaceAt(x, t, layer));
  }
  ctx.lineTo(W + 2, H + 2);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
}

/** Bright spray mist above the crest — key to the "white leading edge" look */
export function drawSpray(
  ctx: CanvasRenderingContext2D,
  W: number,
  fillY: number,
  t: number,
  alpha: number,
) {
  const SPRAY_H = 70;
  const topY = fillY + FRONT.yOff;

  // Clip to the region above the front wave silhouette
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-2, fillY - SPRAY_H);
  for (let x = -2; x <= W + 2; x += 3) {
    ctx.lineTo(x, topY + surfaceAt(x, t, FRONT));
  }
  ctx.lineTo(W + 2, fillY - SPRAY_H);
  ctx.closePath();
  ctx.clip();

  // Gradient: opaque white at wave crest → transparent upward
  const mist = ctx.createLinearGradient(0, fillY - SPRAY_H, 0, fillY + 10);
  mist.addColorStop(0,    `rgba(255,255,255,0)`);
  mist.addColorStop(0.55, `rgba(220,245,255,${0.18 * alpha})`);
  mist.addColorStop(0.82, `rgba(255,255,255,${0.55 * alpha})`);
  mist.addColorStop(1,    `rgba(255,255,255,${0.85 * alpha})`);
  ctx.fillStyle = mist;
  ctx.fillRect(-2, fillY - SPRAY_H, W + 4, SPRAY_H + 20);

  ctx.restore();
}

/** Foam lines tracking the actual layer surfaces */
export function drawFoam(
  ctx: CanvasRenderingContext2D,
  W: number,
  fillY: number,
  t: number,
  alpha: number,
) {
  const lines = [
    { layer: LAYERS[3], yOff: 10, width: 4,   opacity: 0.88 },
    { layer: LAYERS[2], yOff: 28, width: 2.5, opacity: 0.50 },
    { layer: LAYERS[1], yOff: 48, width: 1.5, opacity: 0.28 },
    { layer: LAYERS[0], yOff: 64, width: 1,   opacity: 0.15 },
  ];

  for (const l of lines) {
    ctx.beginPath();
    for (let x = -2; x <= W + 2; x += 2) {
      const y = fillY + l.yOff + surfaceAt(x, t, l.layer) * 0.85;
      if (x === -2) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(255,255,255,${l.opacity * alpha})`;
    ctx.lineWidth = l.width;
    ctx.lineJoin = "round";
    ctx.stroke();
  }
}

/** Subtle subsurface caustic glow */
export function drawCaustics(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  fillY: number, t: number,
  alpha: number,
) {
  if (alpha < 0.15) return;
  const count = 10;
  for (let i = 0; i < count; i++) {
    const bx = (i / count) * W + 80 * Math.sin(t * 0.6 + i * 1.4);
    const by = fillY + 70 + ((i * 137) % Math.max(H - fillY - 80, 1));
    const r  = 20 + 12 * Math.sin(t * 1.1 + i);
    const g  = ctx.createRadialGradient(bx, by, 0, bx, by, r);
    g.addColorStop(0, `rgba(186,230,253,${0.18 * alpha})`);
    g.addColorStop(1, "rgba(186,230,253,0)");
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }
}

/** Spray droplets ejected from the front-wave crests */
export interface Droplet {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  life: number;   // 0..1, counts down
  decay: number;
}

export function spawnDroplets(
  drops: Droplet[],
  W: number,
  fillY: number,
  t: number,
) {
  const topY = fillY + FRONT.yOff;
  // sample a few random x positions; spawn where the surface is near a crest
  for (let i = 0; i < 4; i++) {
    const x = Math.random() * W;
    const s = surfaceAt(x, t, FRONT);
    const sNext = surfaceAt(x + 4, t, FRONT);
    // crest = surface well above midline (negative s, canvas y-down)
    if (s < -9) {
      const slope = (sNext - s) / 4;
      drops.push({
        x,
        y: topY + s - 2,
        vx: -slope * 60 + (Math.random() - 0.5) * 50,
        vy: -(60 + Math.random() * 110),
        r: 0.8 + Math.random() * 1.8,
        life: 1,
        decay: 1.2 + Math.random() * 1.4,
      });
    }
  }
  if (drops.length > 160) drops.splice(0, drops.length - 160);
}

export function drawDroplets(
  ctx: CanvasRenderingContext2D,
  drops: Droplet[],
  dt: number,
  alpha: number,
) {
  const GRAVITY = 480;
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.life -= d.decay * dt;
    if (d.life <= 0) { drops.splice(i, 1); continue; }
    d.vy += GRAVITY * dt;
    d.x  += d.vx * dt;
    d.y  += d.vy * dt;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.85 * d.life * alpha})`;
    ctx.fill();
  }
}
