"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

type Easing = "smooth" | "linear" | "snappy";
type Trigger = "loop" | "hover" | "view";

export interface RainbowTextProps {
  text?: string;
  children?: ReactNode;
  /** Muted base when the band is not over the glyph. */
  color?: string;
  speed?: number;
  delay?: number;
  angle?: number;
  bandWidth?: number;
  softness?: number;
  bands?: number;
  direction?: "left" | "right";
  easing?: Easing;
  trigger?: Trigger;
  yoyo?: boolean;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

interface Settings {
  color: string;
  speed: number;
  delay: number;
  angle: number;
  bandWidth: number;
  softness: number;
  bands: number;
  sign: number;
  ease: (t: number) => number;
  trigger: Trigger;
  yoyo: boolean;
  disabled: boolean;
}

const EASINGS: Record<Easing, (t: number) => number> = {
  linear: (t) => t,
  smooth: (t) => 0.5 - Math.cos(Math.PI * t) / 2,
  snappy: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2),
};
const TRIGGERS: Trigger[] = ["loop", "hover", "view"];
const FALLOFF = [0, 0.2, 0.4, 0.6, 0.8, 1];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

let paint: CanvasRenderingContext2D | null = null;

const parseColor = (value: string): number[] | null => {
  if (typeof document === "undefined") return null;
  if (!paint) paint = document.createElement("canvas").getContext("2d");
  if (!paint) return null;
  paint.fillStyle = "#000000";
  paint.fillStyle = value;
  const resolved = String(paint.fillStyle);
  if (resolved.startsWith("#")) {
    return [1, 3, 5].map((i) => parseInt(resolved.slice(i, i + 2), 16)).concat(1);
  }
  const parts = resolved.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return null;
  return [Number(parts[0]), Number(parts[1]), Number(parts[2]), parts.length > 3 ? Number(parts[3]) : 1];
};

const blend = (from: number[], to: number[], amount: number) => {
  const channel = (a: number, b: number) =>
    Math.round((Math.pow(a / 255, 2.2) * (1 - amount) + Math.pow(b / 255, 2.2) * amount) ** (1 / 2.2) * 255);
  const alpha = from[3] * (1 - amount) + to[3] * amount;
  if (alpha <= 0) return "rgba(0, 0, 0, 0)";
  const weigh = (a: number, b: number) => (a * from[3] * (1 - amount) + b * to[3] * amount) / alpha;
  const r = from[3] === to[3] ? channel(from[0], to[0]) : Math.round(weigh(from[0], to[0]));
  const g = from[3] === to[3] ? channel(from[1], to[1]) : Math.round(weigh(from[1], to[1]));
  const b = from[3] === to[3] ? channel(from[2], to[2]) : Math.round(weigh(from[2], to[2]));
  return `rgba(${r}, ${g}, ${b}, ${Math.round(alpha * 1000) / 1000})`;
};

const hslToRgb = (h: number, s: number, l: number): number[] => {
  const sat = s / 100;
  const lig = l / 100;
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lig - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255), 1];
};

const rainbowAt = (position: number, sweepCenter: number) => {
  const hue = ((position - sweepCenter) * 4.2 + 360) % 360;
  return hslToRgb(hue, 92, 62);
};

export function RainbowText({
  text,
  children,
  color = "rgba(250, 245, 238, 0.55)",
  speed = 2.4,
  delay = 0.4,
  angle = 110,
  bandWidth = 55,
  softness = 0.75,
  bands = 1,
  direction = "left",
  easing = "smooth",
  trigger = "loop",
  yoyo = false,
  disabled = false,
  className = "",
  style,
}: RainbowTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const settingsRef = useRef<Settings | null>(null);
  const syncRef = useRef<(() => void) | null>(null);
  const content = children ?? text;

  settingsRef.current = {
    color,
    speed: Math.max(0.1, speed),
    delay: Math.max(0, delay),
    angle,
    bandWidth: clamp(bandWidth, 8, 200),
    softness: clamp(softness, 0, 1),
    bands: clamp(Math.round(bands), 1, 2),
    sign: direction === "right" ? 1 : -1,
    ease: EASINGS[easing as Easing] ?? EASINGS.smooth,
    trigger: TRIGGERS.includes(trigger as Trigger) ? (trigger as Trigger) : "loop",
    yoyo,
    disabled,
  };

  useEffect(() => {
    syncRef.current?.();
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const state = {
      pos: null as number | null,
      phase: "idle",
      from: 0,
      to: 0,
      start: 0,
      duration: 1,
      resume: 0,
      flip: false,
      inside: false,
      visible: true,
      seen: false,
      baseKey: "",
    };
    let base: number[] | null = null;
    let raf = 0;
    let timer = 0;
    let last = 0;
    let alive = true;

    const extent = () => {
      const s = settingsRef.current!;
      return s.bandWidth / 2 + (s.bands - 1) * s.bandWidth * 1.2 + 2;
    };
    const entry = () => (settingsRef.current!.sign > 0 ? -extent() : 100 + extent());
    const exit = () => (settingsRef.current!.sign > 0 ? 100 + extent() : -extent());

    const gradient = (pos: number, fill: number[]) => {
      const s = settingsRef.current!;
      const half = s.bandWidth / 2;
      const core = half * (1 - s.softness);
      const fade = half - core;
      const stops: [number, number][] = [];
      for (let band = 0; band < s.bands; band++) {
        const center = pos - s.sign * band * s.bandWidth * 1.2;
        for (const side of [-1, 1]) {
          for (const f of FALLOFF) {
            const at = center + side * (core + fade * (1 - f));
            const amount = f * f * (3 - 2 * f) * (1 - band * 0.2);
            stops.push([at, amount]);
          }
        }
      }
      stops.sort((a, b) => a[0] - b[0]);
      const list = stops.map(([at, amount]) => {
        const rainbow = rainbowAt(at, pos);
        return `${blend(fill, rainbow, amount)} ${at.toFixed(2)}%`;
      });
      return `linear-gradient(${s.angle}deg, ${blend(fill, rainbowAt(0, pos), 0)} 0%, ${list.join(", ")}, ${blend(fill, rainbowAt(100, pos), 0)} 100%)`;
    };

    const staticRainbow = () =>
      `linear-gradient(${settingsRef.current!.angle}deg, #f87171, #fbbf24, #a3e635, #38bdf8, #c084fc, #f472b6)`;

    const draw = () => {
      const s = settingsRef.current!;
      if (s.color !== state.baseKey) {
        state.baseKey = s.color;
        base = parseColor(s.color);
      }
      if (!base) {
        root.style.backgroundImage = staticRainbow();
        return;
      }
      if (reduce || s.disabled || state.pos === null) {
        root.style.backgroundImage = reduce || s.disabled ? `linear-gradient(${s.color}, ${s.color})` : staticRainbow();
        return;
      }
      root.style.backgroundImage = gradient(state.pos, base);
    };

    const sweep = (from: number, to: number, now: number) => {
      const s = settingsRef.current!;
      const span = Math.abs(exit() - entry()) || 1;
      state.phase = "sweep";
      state.from = from;
      state.to = to;
      state.start = now;
      state.duration = s.speed * 1000 * Math.max(0.15, Math.abs(to - from) / span);
    };

    const wake = () => {
      if (raf || !alive) return;
      window.clearTimeout(timer);
      timer = 0;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const tick = (now: number) => {
      raf = 0;
      if (!alive) return;
      const s = settingsRef.current!;
      if (s.disabled || reduce) {
        state.pos = null;
        state.phase = "idle";
        draw();
        return;
      }
      if (state.phase === "sweep") {
        const t = clamp((now - state.start) / state.duration, 0, 1);
        state.pos = state.from + (state.to - state.from) * s.ease(t);
        draw();
        if (t < 1) {
          raf = requestAnimationFrame(tick);
          return;
        }
        if (s.trigger !== "loop") {
          state.phase = "idle";
          state.pos = null;
          draw();
          return;
        }
        state.phase = "wait";
        state.resume = now + s.delay * 1000;
      }
      if (state.phase === "wait") {
        if (!state.visible) return;
        if (now < state.resume) {
          window.clearTimeout(timer);
          timer = window.setTimeout(wake, state.resume - now);
          return;
        }
        if (s.yoyo) {
          state.flip = !state.flip;
          sweep(state.flip ? exit() : entry(), state.flip ? entry() : exit(), now);
        } else {
          sweep(entry(), exit(), now);
        }
        raf = requestAnimationFrame(tick);
        return;
      }
      if (state.phase === "idle" && s.trigger === "loop" && state.visible) {
        state.flip = false;
        sweep(entry(), exit(), now);
        raf = requestAnimationFrame(tick);
      }
    };

    const onEnter = () => {
      state.inside = true;
      const s = settingsRef.current!;
      if (s.disabled || reduce) return;
      if (s.trigger === "hover" && state.phase === "idle") sweep(entry(), exit(), performance.now());
      wake();
    };
    const onLeave = () => {
      state.inside = false;
    };

    const observer = new IntersectionObserver((entries) => {
      state.visible = entries.some((item) => item.isIntersecting);
      const s = settingsRef.current!;
      if (!state.visible) return;
      if (s.trigger === "view" && !state.seen && !reduce && !s.disabled) {
        state.seen = true;
        sweep(entry(), exit(), performance.now());
      }
      wake();
    });
    observer.observe(root);

    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointerleave", onLeave);

    syncRef.current = () => {
      draw();
      wake();
    };
    draw();
    wake();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      observer.disconnect();
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      syncRef.current = null;
    };
  }, []);

  return (
    <span
      ref={rootRef}
      className={`relative inline-block bg-no-repeat [background-size:100%_100%] bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] ${className}`}
      style={{ backgroundImage: `linear-gradient(${color}, ${color})`, ...style }}
    >
      {content}
    </span>
  );
}
