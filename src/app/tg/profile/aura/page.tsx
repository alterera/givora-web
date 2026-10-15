"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";
import { tgApi } from "@/lib/tg-api";

type ActivityItem = {
  id: string;
  type: string;
  amount: number;
  label: string;
  createdAt: string;
};

export default function AuraActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(next?: string) {
    const query = next ? `?cursor=${encodeURIComponent(next)}` : "";
    const page = await tgApi<{ items: ActivityItem[]; nextCursor: string | null }>(
      `/api/v1/me/aura/activity${query}`,
    );
    setItems((prev) => (next ? [...prev, ...page.items] : page.items));
    setCursor(page.nextCursor);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <TgPage className="space-y-5">
      <Link
        href="/tg/profile"
        className="glass-subtle inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-ink/85"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Profile
      </Link>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Aura</p>
        <h1 className="font-serif text-3xl">Activity</h1>
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : items.length === 0 ? (
        <TgCard className="p-5 text-sm opacity-75">No Aura activity yet. Accept a creator invite or send a gift to begin.</TgCard>
      ) : (
        <ul className="space-y-2">
          {items.map((row) => (
            <li key={row.id}>
              <TgCard className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 text-left">
                  <p className="text-sm font-medium">{row.label}</p>
                  <p className="text-xs opacity-60">{new Date(row.createdAt).toLocaleString("en-IN")}</p>
                </div>
                <span className={`shrink-0 font-serif text-lg ${row.amount >= 0 ? "text-gold" : "text-rose"}`}>
                  {row.amount >= 0 ? `+${row.amount}` : row.amount}
                </span>
              </TgCard>
            </li>
          ))}
        </ul>
      )}
      {cursor && (
        <button
          type="button"
          className="w-full text-sm underline opacity-80"
          onClick={() => void load(cursor)}
        >
          Load more
        </button>
      )}
    </TgPage>
  );
}
