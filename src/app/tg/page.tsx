"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { telegramApp } from "@/features/telegram/webapp";
import { tgApi } from "@/lib/tg-api";

export default function TelegramEntry() {
  const router = useRouter();
  useEffect(() => {
    const fromLink = new URLSearchParams(window.location.search).get("start");
    const fromInit = new URLSearchParams(telegramApp()?.initData ?? "").get("start_param");
    const param = fromLink || fromInit;
    if (!param) return;
    if (param.startsWith("c_")) {
      void tgApi<{ slug: string }>(`/api/v1/creators/by-code/${param}`).then((creator) => router.replace(`/tg/w/${creator.slug}`));
    } else if (param.startsWith("g_")) {
      router.replace(`/tg/creator/gifts/${param.slice(2)}`);
    } else if (param.startsWith("o_")) {
      router.replace(`/tg/orders/${param.slice(2)}`);
    }
  }, [router]);

  return (
    <div className="px-5 py-10">
      <p className="text-sm uppercase tracking-[0.2em] text-gold">GivoraWorld</p>
      <h1 className="font-serif mt-3 text-4xl">Send a gift. Make their day.</h1>
      <p className="mt-4 text-sm opacity-70">Open a wishlist link to begin, or manage gifts you have received.</p>
      <div className="mt-8 flex flex-col gap-3">
        <Link className="rounded-full bg-ink px-5 py-3 text-center text-paper" href="/tg/creator">
          Creator dashboard
        </Link>
        <Link className="rounded-full border border-ink/15 px-5 py-3 text-center" href="/tg/orders">
          Gifts I sent
        </Link>
      </div>
    </div>
  );
}
