"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";
import { formatInr } from "@/lib/money";
import { tgApi } from "@/lib/tg-api";
import { startRedirectCheckout } from "@/lib/cashfree-telegram-checkout";
import { ApiError } from "@/lib/api";

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

export default function AuraStudioPage() {
  const [items, setItems] = useState<Cosmetic[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    const data = await tgApi<{ items: Cosmetic[] }>("/api/v1/aura/cosmetics");
    setItems(data.items);
  }

  useEffect(() => {
    void refresh().catch(() => toast.error("Could not load Aura Studio"));
  }, []);

  async function buy(item: Cosmetic) {
    setBusy(item.slug);
    try {
      const result = await tgApi<{
        free?: boolean;
        purchaseId?: string;
        checkout?: { sessionId: string; mode: string };
      }>(`/api/v1/aura/cosmetics/${item.slug}/checkout`, {
        method: "POST",
        body: JSON.stringify({ channel: "telegram" }),
      });
      if (result.free) {
        toast.success("Added to your collection");
        await refresh();
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
      await refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not equip");
    } finally {
      setBusy(null);
    }
  }

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
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Aura Studio</p>
        <h1 className="font-serif text-3xl">Your look</h1>
        <p className="mt-1 text-sm opacity-75">
          Cosmetics are optional flair. They never increase your earned Aura rank.
        </p>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <TgCard key={item.id} className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gold">{item.kind}</p>
                <h2 className="font-serif text-xl">{item.name}</h2>
                <p className="mt-1 text-xs leading-relaxed opacity-75">{item.description}</p>
              </div>
              {item.equipped && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-1 text-[10px] font-semibold text-gold">
                  <Check className="h-3 w-3" /> On
                </span>
              )}
            </div>
            <div className={`h-12 rounded-2xl ${item.cssClass ?? "glass-subtle"}`} aria-hidden />
            <div className="flex gap-2">
              {item.owned ? (
                (item.kind === "FRAME" || item.kind === "EFFECT") && (
                  <button
                    type="button"
                    disabled={busy === item.slug || item.equipped}
                    onClick={() => void equip(item)}
                    className="flex-1 rounded-full bg-ink py-2.5 text-sm font-medium text-paper disabled:opacity-40"
                  >
                    {item.equipped ? "Equipped" : "Equip"}
                  </button>
                )
              ) : (
                <button
                  type="button"
                  disabled={busy === item.slug}
                  onClick={() => void buy(item)}
                  className="flex-1 rounded-full bg-ink py-2.5 text-sm font-medium text-paper disabled:opacity-40"
                >
                  {item.pricePaise === 0 ? "Claim free" : `Buy · ${formatInr(item.pricePaise)}`}
                </button>
              )}
            </div>
          </TgCard>
        ))}
      </div>
    </TgPage>
  );
}
