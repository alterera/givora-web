"use client";

import Script from "next/script";
import { BottomDeck } from "@/features/telegram/bottom-deck";
import { TelegramSession, useTelegramSession } from "@/features/telegram/session";

function Gate({ children }: { children: React.ReactNode }) {
  const { status } = useTelegramSession();
  if (status === "loading") {
    return <p className="px-6 py-24 text-center text-sm opacity-70">Signing you in with Telegram…</p>;
  }
  if (status === "outside") {
    return (
      <p className="px-6 py-24 text-center">
        Open GivoraWorld from the Telegram bot. Telegram signs you in when the app starts.
      </p>
    );
  }
  if (status === "error") {
    return <p className="px-6 py-24 text-center">Telegram could not confirm this session. Close the app and open it again.</p>;
  }
  return children;
}

export default function TelegramLayout({ children }: { children: React.ReactNode }) {
  return (
    <TelegramSession>
      <div className="min-h-full bg-[var(--tg-bg-color,var(--paper))] pb-[calc(7rem+env(safe-area-inset-bottom))] text-[var(--tg-text-color,var(--ink))]">
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
          onLoad={() => window.dispatchEvent(new Event("tg-sdk-ready"))}
        />
        <Gate>{children}</Gate>
        <BottomDeck />
      </div>
    </TelegramSession>
  );
}
