"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { telegramApp } from "@/features/telegram/webapp";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";
import { tgApi } from "@/lib/tg-api";

function startParam() {
  const fromLink = new URLSearchParams(window.location.search).get("start");
  const fromInit = new URLSearchParams(telegramApp()?.initData ?? "").get("start_param");
  return fromLink || fromInit || "";
}

export default function TelegramEntry() {
  const router = useRouter();
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    const param = startParam();
    if (param.startsWith("c_")) {
      void tgApi<{ slug: string }>(`/api/v1/creators/by-code/${param}`).then((creator) =>
        router.replace(`/tg/w/${creator.slug}`),
      );
      return;
    }
    if (param.startsWith("g_")) {
      router.replace(`/tg/creator/gifts/${param.slice(2)}`);
      return;
    }
    if (param.startsWith("o_")) {
      router.replace(`/tg/orders/${param.slice(2)}`);
      return;
    }
    void tgApi<{ slug: string }>("/api/v1/creators/me")
      .then(() => router.replace("/tg/creator"))
      .catch(() => setShowAbout(true));
  }, [router]);

  if (!showAbout) {
    return (
      <TgPage className="flex min-h-[50dvh] items-center justify-center">
        <p className="text-center text-sm opacity-70">Loading…</p>
      </TgPage>
    );
  }

  return (
    <TgPage className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-gold">GivoraWorld</p>
        <h1 className="font-serif mt-2 text-3xl">Gifts that feel personal</h1>
      </div>
      <p className="text-sm leading-relaxed opacity-80">
        GivoraWorld connects fans and creators through private wishlists. You buy a real gift from a creator&apos;s own link;
        they receive the product, not cash, and their home address never appears on the page.
      </p>
      <p className="text-sm leading-relaxed opacity-80">
        Open a creator&apos;s Telegram or web link to see what they wish for, send one gift at a time, and track what you sent
        from <span className="font-medium">Sent</span> in the menu below.
      </p>
      <TgCard className="text-sm opacity-80">
        No wishlist link yet? Ask your favourite creator to share theirs from GivoraWorld.
      </TgCard>
    </TgPage>
  );
}
