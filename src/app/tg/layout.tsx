"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { BottomDeck } from "@/features/telegram/bottom-deck";
import { TelegramSession, useTelegramSession } from "@/features/telegram/session";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";

function Gate({ children }: { children: React.ReactNode }) {
  const { status } = useTelegramSession();
  if (status === "loading") {
    return (
      <TgPage className="flex min-h-[var(--tg-viewport-height,100dvh)] items-center justify-center">
        <TgCard className="px-6 py-5 text-center text-sm opacity-85">
          Signing you in with Telegram…
        </TgCard>
      </TgPage>
    );
  }
  if (status === "outside") {
    return (
      <TgPage className="flex min-h-[var(--tg-viewport-height,100dvh)] items-center justify-center">
        <TgCard className="max-w-sm space-y-2 p-6 text-center">
          <p className="font-serif text-2xl">Open in Telegram</p>
          <p className="text-sm opacity-80">
            Open GivoraWorld from the Telegram bot. Telegram signs you in automatically when the Mini App starts.
          </p>
        </TgCard>
      </TgPage>
    );
  }
  if (status === "error") {
    return (
      <TgPage className="flex min-h-[var(--tg-viewport-height,100dvh)] items-center justify-center">
        <TgCard className="max-w-sm space-y-2 p-6 text-center">
          <p className="font-serif text-2xl">Session expired</p>
          <p className="text-sm opacity-80">
            Telegram could not confirm this session. Close the Mini App and open it again.
          </p>
        </TgCard>
      </TgPage>
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
      className={`min-h-[var(--tg-viewport-height,100dvh)] ${bottomPad} bg-transparent text-ink`}
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
