"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AuraMeter, type AuraSummary } from "@/features/aura/aura-meter";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";
import { ApiError } from "@/lib/api";
import { startRedirectCheckout } from "@/lib/cashfree-telegram-checkout";
import { formatInr } from "@/lib/money";
import { tgApi } from "@/lib/tg-api";

type AuraProfile = AuraSummary & {
  milestones: Array<{ key: string; label: string; achievedAt: string }>;
};

type ActivityItem = {
  id: string;
  amount: number;
  label: string;
  createdAt: string;
};

type Cosmetic = {
  id: string;
  slug: string;
  name: string;
  description: string;
  kind: string;
  pricePaise: number;
  cssClass: string | null;
  owned: boolean;
  equipped: boolean;
};

export default function AuraPage() {
  const [aura, setAura] = useState<AuraProfile | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [items, setItems] = useState<Cosmetic[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  async function refreshCosmetics() {
    const data = await tgApi<{ items: Cosmetic[] }>("/api/v1/aura/cosmetics");
    setItems(data.items);
  }

  useEffect(() => {
    void Promise.all([
      tgApi<AuraProfile>("/api/v1/me/aura").then(setAura).catch(() => setAura(null)),
      tgApi<{ items: ActivityItem[] }>("/api/v1/me/aura/activity")
        .then((page) => setActivity(page.items.slice(0, 6)))
        .catch(() => setActivity([])),
      refreshCosmetics().catch(() => toast.error("Could not load Aura purchases")),
    ]).finally(() => setReady(true));
  }, []);

  async function buy(item: Cosmetic) {
    setBusy(item.slug);
    try {
      const result = await tgApi<{
        free?: boolean;
        checkout?: { sessionId: string; mode: string };
      }>(`/api/v1/aura/cosmetics/${item.slug}/checkout`, {
        method: "POST",
        body: JSON.stringify({ channel: "telegram" }),
      });
      if (result.free) {
        toast.success("Added to your collection");
        await refreshCosmetics();
        return;
      }
      if (result.checkout?.sessionId) {
        await startRedirectCheckout(result.checkout.sessionId, result.checkout.mode as "sandbox" | "production", "_self");
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Purchase failed");
    } finally {
      setBusy(null);
    }
  }

  async function equip(item: Cosmetic) {
    setBusy(item.slug);
    try {
      await tgApi(`/api/v1/aura/cosmetics/${item.slug}/equip`, { method: "POST", body: "{}" });
      toast.success("Equipped");
      await refreshCosmetics();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not equip");
    } finally {
      setBusy(null);
    }
  }

  return (
    <TgPage className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Aura</p>
        <h1 className="font-serif text-3xl">Your presence</h1>
        <p className="mt-1 text-sm text-ink/65">Rank, activity, and visual purchases live here.</p>
      </div>

      {!ready && (
        <div className="space-y-3">
          <Skeleton className="h-36 w-full rounded-[1.75rem]" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      )}

      {ready && aura && (
        <section className="rounded-[1.75rem] border border-white/12 bg-white/[0.07] p-5 backdrop-blur-2xl">
          <AuraMeter aura={aura} compact />
          {aura.milestones.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {aura.milestones.map((milestone) => (
                <span key={milestone.key} className="rounded-full bg-white/10 px-3 py-1 text-xs">
                  {milestone.label}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {ready && <section className="space-y-2">
        <h2 className="px-1 text-xs uppercase tracking-[0.16em] text-ink/55">Recent activity</h2>
        {activity.length === 0 ? (
          <TgCard className="p-4 text-sm text-ink/70">Send a gift or accept an invite to start earning Aura.</TgCard>
        ) : (
          activity.map((row) => (
            <TgCard key={row.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{row.label}</p>
                <p className="text-xs text-ink/55">{new Date(row.createdAt).toLocaleString("en-IN")}</p>
              </div>
              <span className={`font-serif text-lg ${row.amount >= 0 ? "text-gold" : "text-rose"}`}>
                {row.amount >= 0 ? `+${row.amount}` : row.amount}
              </span>
            </TgCard>
          ))
        )}
      </section>}

      {ready && <section className="space-y-3">
        <h2 className="px-1 text-xs uppercase tracking-[0.16em] text-ink/55">Purchases</h2>
        {items.map((item) => (
          <TgCard key={item.id} className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gold">{item.kind}</p>
                <h3 className="font-serif text-xl">{item.name}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink/70">{item.description}</p>
              </div>
              {item.equipped && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-1 text-[10px] font-semibold text-gold">
                  <Check className="h-3 w-3" /> On
                </span>
              )}
            </div>
            <div className={`h-12 rounded-2xl ${item.cssClass ?? "glass-subtle"}`} aria-hidden />
            {item.owned ? (
              (item.kind === "FRAME" || item.kind === "EFFECT") && (
                <button
                  type="button"
                  disabled={busy === item.slug || item.equipped}
                  onClick={() => void equip(item)}
                  className="w-full rounded-full bg-ink py-2.5 text-sm font-medium text-paper disabled:opacity-40"
                >
                  {item.equipped ? "Equipped" : "Equip"}
                </button>
              )
            ) : (
              <button
                type="button"
                disabled={busy === item.slug}
                onClick={() => void buy(item)}
                className="w-full rounded-full bg-ink py-2.5 text-sm font-medium text-paper disabled:opacity-40"
              >
                {item.pricePaise === 0 ? "Claim free" : `Buy · ${formatInr(item.pricePaise)}`}
              </button>
            )}
          </TgCard>
        ))}
      </section>}
    </TgPage>
  );
}
