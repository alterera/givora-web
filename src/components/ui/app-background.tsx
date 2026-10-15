"use client";

import { useEffect, useState } from "react";
import { telegramApp } from "@/features/telegram/webapp";
import DarkVeil from "./dark-veil";

/** Givora uses one visual theme everywhere (light cream text on purple veil). */
export function applyDocumentTheme() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = "dark";
  root.style.colorScheme = "dark";
}

const VEIL_COLOR = "#9d4edd";

export function AppBackground() {
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    applyDocumentTheme();
    setFinePointer(window.matchMedia("(pointer: fine)").matches);

    const onThemeSignal = () => applyDocumentTheme();
    window.addEventListener("tg-sdk-ready", onThemeSignal);
    window.addEventListener("givora-theme-change", onThemeSignal);

    const tg = telegramApp();
    tg?.onEvent?.("themeChanged", onThemeSignal);

    return () => {
      window.removeEventListener("tg-sdk-ready", onThemeSignal);
      window.removeEventListener("givora-theme-change", onThemeSignal);
      tg?.offEvent?.("themeChanged", onThemeSignal);
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
        quality={finePointer ? 0.55 : 0.38}
        dpr={finePointer ? undefined : 1}
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
