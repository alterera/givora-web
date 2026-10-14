"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Gift, ShieldCheck, Sparkles, X } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { WishlistWheel } from "@/features/telegram/wishlist-wheel";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";
import { formatInr } from "@/lib/money";
import { tgApi } from "@/lib/tg-api";

type Item = {
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

type Wishlist = {
  displayName: string;
  bio: string;
  giftNote: string;
  avatarUrl: string | null;
  personaDisclosure: string | null;
  slug: string;
  id: string;
  items: Item[];
};

export default function WishlistPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [open, setOpen] = useState<Item | null>(null);
  const [invite, setInvite] = useState<{
    eligible: boolean;
    accepted: boolean;
    creatorName: string | null;
    reward: number;
  } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    void tgApi<Wishlist>(`/api/v1/creators/${params.slug}`)
      .then(setWishlist)
      .catch(() => toast.error("Wishlist unavailable"));
    void tgApi<{
      eligible: boolean;
      accepted: boolean;
      creatorName: string | null;
      reward: number;
    }>(`/api/v1/creators/${params.slug}/invite`)
      .then((status) => {
        setInvite(status);
        setInviteOpen(status.eligible && !status.accepted);
      })
      .catch(() => setInvite(null));
  }, [params.slug]);

  async function acceptInvite() {
    setAccepting(true);
    try {
      const result = await tgApi<{ alreadyAccepted: boolean; awarded: number }>(
        `/api/v1/creators/${params.slug}/invite/accept`,
        { method: "POST", body: "{}" },
      );
      if (result.awarded > 0) {
        toast.success(`+${result.awarded} Aura`);
        void confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
      }
      setInvite((prev) => (prev ? { ...prev, accepted: true } : prev));
      setInviteOpen(false);
    } catch {
      toast.error("Could not accept invitation");
    } finally {
      setAccepting(false);
    }
  }

  function giftThis(item: Item) {
    if (!wishlist || item.available === 0) return;
    router.push(`/tg/checkout?creator=${wishlist.id}&variant=${item.variantId}&slug=${wishlist.slug}`);
  }

  if (!wishlist) {
    return (
      <TgPage className="flex min-h-[45dvh] items-center justify-center">
        <p className="text-sm opacity-70">Loading wishlist…</p>
      </TgPage>
    );
  }

  const initial = wishlist.displayName.slice(0, 1).toUpperCase();

  return (
    <TgPage className="space-y-5">
      <TgCard className="flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink font-serif text-2xl text-paper">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">Wishlist</p>
          <h1 className="font-serif truncate text-2xl">{wishlist.displayName}</h1>
          <p className="mt-0.5 text-xs leading-relaxed opacity-75">
            {wishlist.giftNote || wishlist.bio || "Send a gift directly. Delivery details stay private."}
          </p>
        </div>
      </TgCard>

      {invite?.eligible && invite.accepted && (
        <p className="px-1 text-center text-xs opacity-65">
          You&apos;re in {invite.creatorName ?? "this creator"}&apos;s circle.
        </p>
      )}

      {wishlist.personaDisclosure && (
        <p className="px-1 text-xs opacity-60">{wishlist.personaDisclosure}</p>
      )}

      {wishlist.items.length === 0 ? (
        <TgCard className="p-6 text-center text-sm opacity-70">
          No gifts are listed on this wishlist yet.
        </TgCard>
      ) : (
        <WishlistWheel
          items={wishlist.items}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
          onGift={giftThis}
          onDetails={setOpen}
        />
      )}

      <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-xs opacity-60">
        <ShieldCheck className="h-3.5 w-3.5" /> Creator receives the item, never cash. Address stays private.
      </p>

      {inviteOpen && invite?.creatorName && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="glass-card-strong w-full max-w-md space-y-4 rounded-3xl p-6 text-ink">
            <div className="flex items-center gap-2 text-gold">
              <Sparkles className="h-4 w-4" />
              <p className="text-xs uppercase tracking-[0.2em]">Invitation</p>
            </div>
            <h2 className="font-serif text-2xl">Join {invite.creatorName}&apos;s circle</h2>
            <p className="text-sm leading-relaxed opacity-85">
              Accept this invitation from {invite.creatorName} to earn{" "}
              <span className="font-medium text-gold">+{invite.reward} Aura</span>. You can only accept once per
              creator.
            </p>
            <button
              type="button"
              disabled={accepting}
              onClick={() => void acceptInvite()}
              className="w-full rounded-full bg-ink py-3.5 text-sm font-medium text-paper disabled:opacity-50"
            >
              Accept invitation
            </button>
            <button
              type="button"
              className="w-full text-sm opacity-70"
              onClick={() => setInviteOpen(false)}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center" onClick={() => setOpen(null)}>
          <div
            className="glass-card-strong w-full max-w-md space-y-4 rounded-3xl p-6 text-ink"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider text-gold">
                  {open.type === "DIGITAL" ? "Digital" : "Physical Gift"}
                </span>
                <h2 className="font-serif mt-1 text-2xl">{open.productName}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="rounded-full p-1.5 opacity-60 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm leading-relaxed opacity-85">{open.description}</p>
            <div className="glass-subtle space-y-1 rounded-2xl p-3.5 text-xs">
              <p className="font-medium text-sm">
                {formatInr(open.pricePaise)}{" "}
                <span className="font-normal opacity-75">
                  {open.shippingPaise ? `+ ${formatInr(open.shippingPaise)} shipping` : "· Free delivery"}
                </span>
              </p>
              {open.deliveryInfo && <p className="opacity-75">{open.deliveryInfo}</p>}
              {open.refundTerms && <p className="opacity-75">{open.refundTerms}</p>}
            </div>
            <button
              type="button"
              className="w-full rounded-full bg-ink px-5 py-3.5 text-sm font-medium text-paper disabled:opacity-40"
              disabled={open.available === 0}
              onClick={() => giftThis(open)}
            >
              Gift this · {formatInr(open.pricePaise + open.shippingPaise)}
            </button>
          </div>
        </div>
      )}
    </TgPage>
  );
}
