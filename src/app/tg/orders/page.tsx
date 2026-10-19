"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";
import {
  GIFT_FILTERS,
  orderMatchesFilter,
  resolveGiftDisplayStatus,
  type GiftFilterKey,
} from "@/features/telegram/gift-order-status";
import { useTgOrders } from "@/features/telegram/queries";
import { formatInr } from "@/lib/money";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 8;

const toneClass = {
  gold: "bg-gold/20 text-gold",
  rose: "bg-rose/20 text-rose",
  ink: "bg-ink/15 text-ink",
  muted: "bg-white/10 text-ink/70",
};

export default function SentOrders() {
  const { data: orders, isLoading } = useTgOrders();
  const [filter, setFilter] = useState<GiftFilterKey>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const list = orders ?? [];
    return list.filter((order) => orderMatchesFilter(order, filter));
  }, [orders, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function changeFilter(next: GiftFilterKey) {
    setFilter(next);
    setPage(1);
  }

  return (
    <TgPage className="space-y-5 pb-28">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-gold">Sent</p>
        <h1 className="font-serif mt-2 text-3xl">Gifts you sent</h1>
        <p className="mt-1 text-sm opacity-70">Filter by payment and redemption status.</p>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {GIFT_FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => changeFilter(item.key)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition",
              filter === item.key ? "bg-ink text-paper" : "glass-subtle text-ink/80",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading &&
          Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-2xl" />
          ))}
        {!isLoading && (orders?.length ?? 0) === 0 && (
          <p className="text-sm opacity-70">You have not sent a gift yet. Open a creator&apos;s invite link to start.</p>
        )}
        {!isLoading && (orders?.length ?? 0) > 0 && filtered.length === 0 && (
          <p className="text-sm opacity-70">No gifts match this filter.</p>
        )}
        {slice.map((order) => {
          const display = resolveGiftDisplayStatus(order);
          const names = order.items.map((item) => item.productName).join(", ");
          return (
            <Link key={order.id} href={`/tg/orders/${order.id}`} className="block">
              <TgCard className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gold">{order.creator.displayName}</p>
                    <p className="font-medium leading-snug">{names}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide", toneClass[display.tone])}>
                    {display.label}
                  </span>
                </div>
                {display.hint && <p className="text-xs leading-relaxed opacity-65">{display.hint}</p>}
                <p className="text-xs opacity-55">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  {" · "}
                  {formatInr(order.totalPaise)}
                </p>
              </TgCard>
            </Link>
          );
        })}
      </div>

      {!isLoading && filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="glass-subtle inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="text-xs opacity-70">
            Page {safePage} of {pageCount}
          </span>
          <button
            type="button"
            disabled={safePage >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            className="glass-subtle inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </TgPage>
  );
}
