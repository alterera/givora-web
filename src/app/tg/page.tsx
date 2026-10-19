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
  const [showInviteOnly, setShowInviteOnly] = useState(false);

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
      else setShowInviteOnly(true);
    }
  }, [router, isCreator, status]);

  if (!showInviteOnly) {
    return (
      <TgPage className="space-y-4 pt-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </TgPage>
    );
  }

  return (
    <TgPage className="flex min-h-[50vh] flex-col justify-center space-y-5 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-gold">GivoraWorld</p>
        <h1 className="font-serif mt-3 text-3xl">Open your invite link</h1>
      </div>
      <p className="text-sm leading-relaxed opacity-80">
        GivoraWorld is invite-only. Ask your favourite creator for their wishlist link, or tap the link they sent you in
        Telegram to browse gifts and send one.
      </p>
      <TgCard className="text-sm opacity-80">
        Once you&apos;re on their wishlist, swipe through gifts, tap <span className="font-medium">Gift this</span>, and
        pay securely. Track everything from <span className="font-medium">Sent</span> in the menu below.
      </TgCard>
    </TgPage>
  );
}
