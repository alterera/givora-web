"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Gift as GiftIcon } from "lucide-react";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";
import { tgApi } from "@/lib/tg-api";

type Gift = { id: string; status: string; productName: string; from: string };

const STATUS_LABELS: Record<string, string> = {
  AWAITING_REDEMPTION: "Ready to unwrap & redeem",
  REDEEMED: "Redeemed · Being prepared",
  FULFILLED: "Delivered",
  EXPIRED: "Expired",
  REFUNDED: "Refunded",
};

export default function GiftInbox() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void tgApi<Gift[]>("/api/v1/gifts/received")
      .then(setGifts)
      .finally(() => setLoading(false));
  }, []);

  const groups = ["AWAITING_REDEMPTION", "REDEEMED", "FULFILLED", "EXPIRED", "REFUNDED"];

  return (
    <TgPage className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/tg/creator"
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-ink/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Studio
        </Link>
        <span className="text-xs uppercase tracking-[0.18em] text-gold">Inbox</span>
      </div>

      <div>
        <h1 className="font-serif text-3xl tracking-tight">Gifts for you</h1>
        <p className="mt-1 text-sm opacity-75">Unwrap gifts from your fans and enter your private delivery address.</p>
      </div>

      {loading ? (
        <TgCard className="p-6 text-center text-sm opacity-70">Loading your gifts…</TgCard>
      ) : gifts.length === 0 ? (
        <TgCard className="space-y-2 p-6 text-center">
          <GiftIcon className="mx-auto h-7 w-7 text-gold opacity-80" />
          <p className="font-medium">No gifts yet</p>
          <p className="text-xs opacity-70">Share your wishlist link from Creator Studio so fans can send you a gift.</p>
        </TgCard>
      ) : (
        groups.map((status) => {
          const items = gifts.filter((gift) => gift.status === status);
          if (items.length === 0) return null;
          return (
            <section key={status} className="space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gold">
                {STATUS_LABELS[status] ?? status}
              </h2>
              {items.map((gift) => (
                <Link key={gift.id} href={`/tg/creator/gifts/${gift.id}`} className="block">
                  <TgCard className="flex items-center justify-between p-4 transition hover:opacity-95">
                    <div>
                      <p className="font-serif text-xl">{gift.productName}</p>
                      <p className="mt-0.5 text-xs opacity-70">From {gift.from}</p>
                    </div>
                    <span className="rounded-full bg-ink px-3.5 py-1.5 text-xs font-medium text-paper">
                      {status === "AWAITING_REDEMPTION" ? "Redeem" : "View"}
                    </span>
                  </TgCard>
                </Link>
              ))}
            </section>
          );
        })
      )}
    </TgPage>
  );
}
