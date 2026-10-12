"use client";

import Script from "next/script";
import { useEffect } from "react";
import { telegramApp } from "@/features/telegram/webapp";

export default function TelegramLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const app = telegramApp();
    if (!app) return;
    app.ready();
    app.expand();
    const root = document.documentElement;
    for (const [key, value] of Object.entries(app.themeParams)) {
      root.style.setProperty(`--tg-${key.replace(/_/g, "-")}`, value);
    }
  }, []);

  return (
    <div className="min-h-full bg-[var(--tg-bg-color,var(--paper))] text-[var(--tg-text-color,var(--ink))]">
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      {children}
    </div>
  );
}
