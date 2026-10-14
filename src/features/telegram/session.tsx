"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { applyDocumentTheme, resolveColorScheme } from "@/components/ui/app-background";
import { telegramApp } from "@/features/telegram/webapp";
import { ensureTelegramSession, type TgAccount } from "@/lib/tg-api";

type SessionState = {
  status: "loading" | "ready" | "outside" | "error";
  account: TgAccount | null;
  photoUrl: string | null;
  colorScheme: "dark" | "light";
};

const SessionContext = createContext<SessionState>({
  status: "loading",
  account: null,
  photoUrl: null,
  colorScheme: "dark",
});

export function useTelegramSession() {
  return useContext(SessionContext);
}

export function TelegramSession({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({
    status: "loading",
    account: null,
    photoUrl: null,
    colorScheme: "dark",
  });

  useEffect(() => {
    let cancelled = false;

    const applyTelegramTheme = () => {
      const app = telegramApp();
      const root = document.documentElement;
      const scheme = resolveColorScheme();
      applyDocumentTheme(scheme);
      if (app) {
        for (const [key, value] of Object.entries(app.themeParams ?? {})) {
          root.style.setProperty(`--tg-${key.replace(/_/g, "-")}`, value);
        }
        try {
          app.setHeaderColor?.("#0a0810");
          app.setBackgroundColor?.("#0a0810");
        } catch {
          // Ignore on older Telegram WebApp versions
        }
      }
      window.dispatchEvent(new Event("givora-theme-change"));
      if (!cancelled) {
        setState((prev) => ({ ...prev, colorScheme: scheme }));
      }
    };

    const boot = async () => {
      const app = telegramApp();
      applyTelegramTheme();
      if (!app?.initData) return;
      app.ready();
      app.expand();
      const root = document.documentElement;
      const viewport = app.viewportStableHeight;
      if (viewport && viewport > 0) {
        root.style.setProperty("--tg-viewport-height", `${viewport}px`);
      }
      app.onEvent?.("themeChanged", applyTelegramTheme);
      const account = await ensureTelegramSession();
      if (cancelled) return;
      setState({
        status: account ? "ready" : "error",
        account,
        photoUrl: app.initDataUnsafe?.user?.photo_url ?? null,
        colorScheme: resolveColorScheme(),
      });
    };

    void boot();
    const outsideTimer = window.setTimeout(() => {
      if (!telegramApp()?.initData && !cancelled) {
        setState((prev) => ({ ...prev, status: "outside", account: null, photoUrl: null }));
      }
    }, 1200);
    window.addEventListener("tg-sdk-ready", boot);
    return () => {
      cancelled = true;
      window.clearTimeout(outsideTimer);
      telegramApp()?.offEvent?.("themeChanged", applyTelegramTheme);
      window.removeEventListener("tg-sdk-ready", boot);
    };
  }, []);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}
