"use client";

import { useEffect, useState } from "react";
import Grainient from "./grainient";
import { telegramApp } from "@/features/telegram/webapp";

const GIVORA_COLORS = ["#120f17", "#2a0f0a", "#9a3412", "#f97316", "#fed7aa"];

function hexLuminance(hex?: string): number | null {
  if (!hex) return null;
  const clean = hex.replace("#", "").trim();
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function resolveColorScheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  const tg = telegramApp();
  if (tg?.colorScheme === "light" || tg?.colorScheme === "dark") {
    return tg.colorScheme;
  }
  const bgLum = hexLuminance(tg?.themeParams?.bg_color);
  if (bgLum !== null) {
    return bgLum > 0.55 ? "light" : "dark";
  }
  return "dark";
}

export function applyDocumentTheme(scheme: "dark" | "light") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = scheme;
  root.style.colorScheme = scheme;
}

export function AppBackground() {
  const [scheme, setScheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const sync = () => {
      const next = resolveColorScheme();
      setScheme(next);
      applyDocumentTheme(next);
    };
    sync();

    const tg = telegramApp();
    tg?.onEvent?.("themeChanged", sync);
    window.addEventListener("tg-sdk-ready", sync);
    window.addEventListener("givora-theme-change", sync);

    return () => {
      tg?.offEvent?.("themeChanged", sync);
      window.removeEventListener("tg-sdk-ready", sync);
      window.removeEventListener("givora-theme-change", sync);
    };
  }, []);

  const isLight = scheme === "light";

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Grainient
        colors={GIVORA_COLORS}
        angle={55}
        flow={0.8}
        silk={0.35}
        grainAmount={0.08}
        lightMode={isLight}
        className="h-full w-full"
      />
      <div
        className={
          isLight
            ? "absolute inset-0 bg-gradient-to-b from-white/35 via-white/15 to-white/40"
            : "absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/45"
        }
      />
    </div>
  );
}
