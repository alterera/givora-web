"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { BottomDeck } from "@/features/telegram/bottom-deck";
import { TelegramSession, useTelegramSession } from "@/features/telegram/session";

function Gate({ children }: { children: React.ReactNode }) {
  const { status } = useTelegramSession();
  if (status === "loading") {
    return (
      <p className="flex min-h-[var(--tg-viewport-height,100dvh)] items-center justify-center px-6 text-center text-sm opacity-70">
        Signing you in with Telegram…
      </p>
    );
  }
  if (status === "outside") {
    return (
      <p className="flex min-h-[var(--tg-viewport-height,100dvh)] items-center justify-center px-6 text-center">
        Open GivoraWorld from the Telegram bot. Telegram signs you in when the app starts.
      </p>
    );
  }
  if (status === "error") {
    return (
      <p className="flex min-h-[var(--tg-viewport-height,100dvh)] items-center justify-center px-6 text-center">
        Telegram could not confirm this session. Close the app and open it again.
      </p>
    );
  }
  return children;
}

function TgRoot({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const immersive = path.startsWith("/tg/checkout") || path.startsWith("/tg/return");
  const bottomPad = immersive ? "pb-[max(1.5rem,env(safe-area-inset-bottom))]" : "pb-[calc(7rem+env(safe-area-inset-bottom))]";

  return (
    <div
      data-tg-shell
      className={`min-h-[var(--tg-viewport-height,100dvh)] ${bottomPad} bg-[var(--tg-bg-color,var(--paper))] text-[var(--tg-text-color,var(--ink))]`}
    >
      <Gate>{children}</Gate>
      <BottomDeck />
    </div>
  );
}

export default function TelegramLayout({ children }: { children: React.ReactNode }) {
  return (
    <TelegramSession>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
        onLoad={() => window.dispatchEvent(new Event("tg-sdk-ready"))}
      />
      <TgRoot>{children}</TgRoot>
    </TelegramSession>
  );
}
