"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Flame, ShieldCheck, Sparkles, X } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { GiftProductCard } from "@/features/telegram/gift-product-card";
import { loadStreak, StreakModal, type StreakStatus } from "@/features/telegram/streak-modal";
import { useTelegramSession } from "@/features/telegram/session";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";
import { type AuraSummary } from "@/features/aura/aura-meter";
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
  const { account, photoUrl } = useTelegramSession();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [aura, setAura] = useState<AuraSummary | null>(null);
  const [streak, setStreak] = useState<StreakStatus | null>(null);
  const [streakOpen, setStreakOpen] = useState(false);
  const [open, setOpen] = useState<Item | null>(null);
  const [invite, setInvite] = useState<{
    eligible: boolean;
    accepted: boolean;
    creatorName: string | null;
    reward: number;
  } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);

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
    void tgApi<AuraSummary>("/api/v1/me/aura").then(setAura).catch(() => setAura(null));
    void loadStreak(params.slug).then(setStreak).catch(() => setStreak(null));

    const purchaseId = new URLSearchParams(window.location.search).get("streakPurchase");
    if (purchaseId) {
      void tgApi<{ status: string; streak: StreakStatus }>(`/api/v1/streak/purchases/${purchaseId}/status`)
        .then((result) => {
          setStreak(result.streak);
          setStreakOpen(true);
          if (result.status === "PAID") toast.success("Streak day secured");
          const url = new URL(window.location.href);
          url.searchParams.delete("streakPurchase");
          url.searchParams.delete("order_id");
          window.history.replaceState({}, "", url.pathname);
        })
        .catch(() => toast.error("Could not confirm streak payment"));
    }
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

  const firstName = (account?.displayName || "there").split(" ")[0] ?? "there";
  const initial = firstName.slice(0, 1).toUpperCase();
  const segments = 10;
  const filled = Math.round(((aura?.progressPercent ?? 0) / 100) * segments);

  return (
    <TgPage className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white/20" />
          ) : (
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-lg text-paper ring-2 ring-white/15">
              {initial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-serif text-xl leading-none">Hi, {firstName}</p>
            <div className="mt-2 flex gap-1" aria-hidden>
              {Array.from({ length: segments }, (_, index) => (
                <span
                  key={index}
                  className={`h-2.5 flex-1 rounded-[3px] ${index < filled ? "bg-gold" : "bg-white/12"}`}
                />
              ))}
            </div>
            {aura && <p className="sr-only">{aura.earnedAura} Aura, {aura.progressPercent}% to next tier</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setStreakOpen(true)}
          className="glass-card relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-rose"
          aria-label={streak?.active ? `Streak ${streak.days} days, open` : "Open streak"}
        >
          <Flame className={`h-5 w-5 ${streak?.active ? "fill-rose" : ""}`} />
          {streak && streak.days > 0 && (
            <span className="absolute -bottom-1 rounded-full bg-ink px-1.5 text-[9px] font-semibold text-paper">
              {streak.days}
            </span>
          )}
        </button>
      </header>

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
        <ul className="space-y-4">
          {wishlist.items.map((item) => (
            <li key={item.variantId}>
              <GiftProductCard item={item} onOpen={() => setOpen(item)} onGift={() => giftThis(item)} />
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-xs opacity-60">
        <ShieldCheck className="h-3.5 w-3.5" /> Creator receives the item, never cash. Address stays private.
      </p>

      {streakOpen && streak && (
        <StreakModal
          slug={params.slug}
          streak={streak}
          onClose={() => setStreakOpen(false)}
        />
      )}

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
