"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";
import { formatInr } from "@/lib/money";
import { tgApi } from "@/lib/tg-api";
import { apiBase } from "@/lib/utils";

type CatalogueItem = {
  id: string;
  name: string;
  description?: string;
  type?: string;
  variants: Array<{ id: string; pricePaise: number }>;
};

type WishlistEntry = {
  wishlistItemId: string;
  productName: string;
  variantId: string;
  pricePaise: number;
};

type Mine = { items: WishlistEntry[] };

export default function ManageWishlist() {
  const [mine, setMine] = useState<Mine | null>(null);
  const [catalogue, setCatalogue] = useState<CatalogueItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    return tgApi<Mine>("/api/v1/creators/me").then(setMine);
  }

  useEffect(() => {
    void load();
    void fetch(`${apiBase()}/api/v1/products`)
      .then((response) => response.json())
      .then((body: { items: CatalogueItem[] }) => setCatalogue(body.items ?? []))
      .catch(() => undefined);
  }, []);

  async function addVariant(variantId: string) {
    setBusyId(variantId);
    try {
      await tgApi("/api/v1/creators/me/wishlist", {
        method: "POST",
        body: JSON.stringify({ variantId }),
      });
      toast.success("Added to your wishlist");
      await load();
    } catch {
      toast.error("Could not add item");
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(wishlistItemId: string) {
    setBusyId(wishlistItemId);
    try {
      await tgApi(`/api/v1/creators/me/wishlist/${wishlistItemId}`, { method: "DELETE" });
      toast.success("Removed from wishlist");
      await load();
    } catch {
      toast.error("Could not remove item");
    } finally {
      setBusyId(null);
    }
  }

  const currentItems = mine?.items ?? [];
  const activeVariantIds = new Set(currentItems.map((i) => i.variantId));

  return (
    <TgPage className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/tg/creator"
          className="glass-subtle inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-ink/85"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Studio
        </Link>
        <span className="text-xs uppercase tracking-[0.18em] text-gold">
          {currentItems.length} {currentItems.length === 1 ? "Gift" : "Gifts"}
        </span>
      </div>

      <div>
        <h1 className="font-serif text-3xl tracking-tight">Your Wishlist</h1>
        <p className="mt-1 text-sm opacity-75">Pick the gifts fans can send you from the Givora catalogue.</p>
      </div>

      <section className="space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider opacity-60">On your wishlist</h2>
        {currentItems.length === 0 ? (
          <TgCard className="p-5 text-center text-sm opacity-70">
            Your wishlist is empty. Tap <strong>Add</strong> on any product below.
          </TgCard>
        ) : (
          currentItems.map((item) => (
            <TgCard key={item.wishlistItemId} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium leading-snug">{item.productName}</p>
                <p className="mt-0.5 text-xs opacity-70">{formatInr(item.pricePaise)}</p>
              </div>
              <button
                type="button"
                disabled={busyId === item.wishlistItemId}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose/25 bg-rose/10 px-3.5 py-1.5 text-xs font-medium text-rose transition hover:bg-rose/20 disabled:opacity-50"
                onClick={() => void removeItem(item.wishlistItemId)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </TgCard>
          ))
        )}
      </section>

      <section className="space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider opacity-60">Givora Catalogue</h2>
        {catalogue.map((product) => {
          const variant = product.variants[0];
          if (!variant) return null;
          const added = activeVariantIds.has(variant.id);
          return (
            <TgCard key={product.id ?? product.name} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium leading-snug">{product.name}</p>
                <p className="mt-0.5 text-xs font-medium text-gold">{formatInr(variant.pricePaise)}</p>
              </div>
              {added ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3.5 py-1.5 text-xs font-medium text-emerald-300">
                  <Check className="h-3.5 w-3.5" /> Added
                </span>
              ) : (
                <button
                  type="button"
                  disabled={busyId === variant.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-paper transition active:scale-95 disabled:opacity-50"
                  onClick={() => void addVariant(variant.id)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              )}
            </TgCard>
          );
        })}
      </section>
    </TgPage>
  );
}
