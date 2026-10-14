"use client";

import { useEffect, useState } from "react";
import DarkVeil from "./dark-veil";
import { telegramApp } from "@/features/telegram/webapp";

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

/** Same veil tint in both Telegram themes — only UI tokens (ink, glass) change. */
const VEIL_COLOR = "#9d4edd";

export function AppBackground() {
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    const sync = () => applyDocumentTheme(resolveColorScheme());
    sync();
    setFinePointer(window.matchMedia("(pointer: fine)").matches);

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

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0a0810]">
      <DarkVeil
        className="h-full w-full"
        color={VEIL_COLOR}
        speed={0.45}
        scale={1.15}
        flow={1.1}
        warp={0.15}
        variation={2}
        brightness={1}
        sheen={0.35}
        glow={0.42}
        grain={0.035}
        quality={0.55}
        mouseInteraction={finePointer}
        mouseStrength={0.85}
        intro
        fade={0.12}
        opacity={1}
        lightMode={false}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/55" />
    </div>
  );
}
