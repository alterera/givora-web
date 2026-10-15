"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { applyDocumentTheme } from "@/components/ui/app-background";
import { telegramApp } from "@/features/telegram/webapp";
import {
  cacheTgBoot,
  provisionalTgAccount,
  readCachedTgBoot,
  refreshTgBoot,
  type TgAccount,
  type TgBoot,
} from "@/lib/tg-api";

type SessionState = {
  status: "loading" | "ready" | "outside" | "error";
  account: TgAccount | null;
  photoUrl: string | null;
  isCreator: boolean;
  creatorSlug: string | null;
};

const SessionContext = createContext<SessionState>({
  status: "loading",
  account: null,
  photoUrl: null,
  isCreator: false,
  creatorSlug: null,
});

export function useTelegramSession() {
  return useContext(SessionContext);
}

function mergeBoot(state: SessionState, boot: TgBoot): SessionState {
  return {
    ...state,
    status: "ready",
    account: boot.user,
    isCreator: boot.isCreator,
    creatorSlug: boot.creatorSlug,
  };
}

export function TelegramSession({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({
    status: "loading",
    account: null,
    photoUrl: null,
    isCreator: false,
    creatorSlug: null,
  });

  useEffect(() => {
    let cancelled = false;

    const applyTelegramChrome = () => {
      applyDocumentTheme();
      const app = telegramApp();
      const root = document.documentElement;
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
    };

    const boot = () => {
      const app = telegramApp();
      applyTelegramChrome();
      if (!app?.initData) return;
      app.ready();
      app.expand();
      const root = document.documentElement;
      const viewport = app.viewportStableHeight;
      if (viewport && viewport > 0) {
        root.style.setProperty("--tg-viewport-height", `${viewport}px`);
      }
      app.onEvent?.("themeChanged", applyTelegramChrome);

      const cached = readCachedTgBoot();
      const provisional = provisionalTgAccount();
      const photoUrl = app.initDataUnsafe?.user?.photo_url ?? null;

      if (cancelled) return;
      setState({
        status: "ready",
        account: cached?.user ?? provisional,
        photoUrl,
        isCreator: cached?.isCreator ?? false,
        creatorSlug: cached?.creatorSlug ?? null,
      });

      void refreshTgBoot().then((fresh) => {
        if (cancelled || !fresh) return;
        cacheTgBoot(fresh);
        setState((prev) => mergeBoot(prev, fresh));
      });
    };

    void boot();
    const outsideTimer = window.setTimeout(() => {
      if (!telegramApp()?.initData && !cancelled) {
        setState({
          status: "outside",
          account: null,
          photoUrl: null,
          isCreator: false,
          creatorSlug: null,
        });
      }
    }, 1200);
    const onBootCache = (event: Event) => {
      const detail = (event as CustomEvent<TgBoot>).detail;
      if (!detail) return;
      setState((prev) => mergeBoot(prev, detail));
    };

    window.addEventListener("tg-sdk-ready", boot);
    window.addEventListener("givora-tg-boot", onBootCache);
    return () => {
      cancelled = true;
      window.clearTimeout(outsideTimer);
      telegramApp()?.offEvent?.("themeChanged", applyTelegramChrome);
      window.removeEventListener("tg-sdk-ready", boot);
      window.removeEventListener("givora-tg-boot", onBootCache);
    };
  }, []);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

/** Called from wishlist bundle when boot fields are included. */
export function applyBootFromWishlist(boot: TgBoot) {
  cacheTgBoot(boot);
}
