"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { telegramApp } from "@/features/telegram/webapp";
import { Skeleton } from "@/components/ui/skeleton";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";
import { useTelegramSession } from "@/features/telegram/session";

function startParam() {
  const fromLink = new URLSearchParams(window.location.search).get("start");
  const fromInit = new URLSearchParams(telegramApp()?.initData ?? "").get("start_param");
  return fromLink || fromInit || "";
}

export default function TelegramEntry() {
  const router = useRouter();
  const { isCreator, status } = useTelegramSession();
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    const param = startParam();
    if (param.startsWith("c_")) {
      router.replace(`/tg/w/${param}`);
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
    if (status === "ready") {
      if (isCreator) router.replace("/tg/creator");
      else setShowAbout(true);
    }
  }, [router, isCreator, status]);

  if (!showAbout) {
    return (
      <TgPage className="space-y-4 pt-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 w-full rounded-2xl" />
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
