"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuraSummary } from "@/features/aura/aura-meter";
import type { StreakStatus } from "@/features/telegram/streak-modal";
import { cacheTgBoot, tgApi, type TgBoot } from "@/lib/tg-api";

export type WishlistItem = {
  variantId: string;
  productName: string;
  description: string;
  pricePaise: number;
  shippingPaise: number;
  type: string;
  imageUrl: string | null;
  available: number | null;
  lowStock: boolean;
  deliveryInfo: string | null;
  refundTerms: string | null;
};

export type Wishlist = {
  displayName: string;
  bio: string;
  giftNote: string;
  avatarUrl: string | null;
  personaDisclosure: string | null;
  slug: string;
  id: string;
  items: WishlistItem[];
};

export type WishlistBundle = {
  wishlist: Wishlist;
  invite: {
    eligible: boolean;
    accepted: boolean;
    creatorName: string | null;
    reward: number;
  };
  streak: StreakStatus;
  aura: AuraSummary;
  boot: TgBoot;
};

export type OrderRow = {
  id: string;
  publicRef: string;
  status: string;
  totalPaise: number;
  paymentExpiresAt: string;
  createdAt: string;
  creator: { displayName: string };
  items: Array<{ productName: string; gift: { status: string } | null }>;
};

export function useTgWishlistBundle(slugOrCode: string) {
  return useQuery({
    queryKey: ["tg-wishlist", slugOrCode],
    queryFn: async () => {
      const bundle = await tgApi<WishlistBundle>(`/api/v1/tg/wishlist/${encodeURIComponent(slugOrCode)}`);
      cacheTgBoot(bundle.boot);
      return bundle;
    },
    enabled: Boolean(slugOrCode),
  });
}

export function useTgOrders() {
  return useQuery({
    queryKey: ["tg-orders"],
    queryFn: () => tgApi<OrderRow[]>("/api/v1/orders"),
  });
}

export type AuraProfile = AuraSummary & {
  milestones: Array<{ key: string; label: string; achievedAt: string }>;
  equipped?: {
    frame: { slug: string; name: string; cssClass: string | null } | null;
    effect: { slug: string; name: string; cssClass: string | null } | null;
  } | null;
};

export function useTgAura() {
  return useQuery({
    queryKey: ["tg-aura"],
    queryFn: () => tgApi<AuraProfile>("/api/v1/me/aura"),
  });
}

export function useTgCreatorMe() {
  return useQuery({
    queryKey: ["tg-creator-me"],
    queryFn: () => tgApi<{ slug: string }>("/api/v1/creators/me"),
    retry: false,
  });
}

export function findWishlistItem(slugOrCode: string, variantId: string, client: ReturnType<typeof useQueryClient>) {
  const bundle = client.getQueryData<WishlistBundle>(["tg-wishlist", slugOrCode]);
  return bundle?.wishlist.items.find((item) => item.variantId === variantId) ?? null;
}
