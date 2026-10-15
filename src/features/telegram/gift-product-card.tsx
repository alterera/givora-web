"use client";

import { Gift } from "lucide-react";
import { formatInr } from "@/lib/money";

export type GiftCardItem = {
  variantId: string;
  productName: string;
  description: string;
  pricePaise: number;
  shippingPaise: number;
  type: string;
  imageUrl: string | null;
  available: number | null;
};

export function GiftProductCard({
  item,
  onOpen,
  onGift,
}: {
  item: GiftCardItem;
  onOpen: () => void;
  onGift: () => void;
}) {
  const soldOut = item.available === 0;
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-white/14 bg-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <button type="button" onClick={onOpen} className="block w-full p-2.5 text-left">
        <div className="relative overflow-hidden rounded-[1.35rem] bg-black/30">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt="" className="aspect-[4/5] w-full object-cover" />
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
              <Gift className="h-10 w-10 text-gold/80" />
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
            {item.type === "DIGITAL" ? "Digital" : "Wishlist"}
          </span>
          {soldOut && (
            <span className="absolute inset-0 grid place-items-center bg-black/45 text-xs font-semibold uppercase tracking-[0.18em] text-white">
              Sold out
            </span>
          )}
        </div>
      </button>
      <div className="space-y-3 px-4 pb-4 pt-1">
        <div>
          <h2 className="font-serif text-[1.35rem] leading-tight">{item.productName}</h2>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink/60">{item.description}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-white/10 px-3.5 py-2 text-sm font-medium backdrop-blur-md">
            {formatInr(item.pricePaise)}
          </span>
          <button
            type="button"
            disabled={soldOut}
            onClick={onGift}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper disabled:opacity-40"
          >
            Gift
            <span aria-hidden>↗</span>
          </button>
        </div>
      </div>
    </article>
  );
}
