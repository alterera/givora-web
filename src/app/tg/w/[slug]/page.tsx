"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Flame, Sparkles, X } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { CircularGallery } from "@/components/ui/circular-gallery";
import { Skeleton } from "@/components/ui/skeleton";
import { StreakModal, type StreakStatus } from "@/features/telegram/streak-modal";
import { useTelegramSession } from "@/features/telegram/session";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";
import { formatInr } from "@/lib/money";
import { tgApi } from "@/lib/tg-api";
import { useTgWishlistBundle, type WishlistBundle, type WishlistItem } from "@/features/telegram/queries";
import { WishlistTour } from "@/features/telegram/wishlist-tour";
import { RainbowText } from "@/components/ui/rainbow-text";

const GIFT_PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="100%" height="100%" fill="#1a1520"/><text x="50%" y="52%" fill="#fbbf24" font-size="42" text-anchor="middle" font-family="sans-serif">Gift</text></svg>`,
  );

export default function WishlistPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { account, photoUrl } = useTelegramSession();
  const { data: bundle, isLoading, isError } = useTgWishlistBundle(params.slug);
  const wishlist = bundle?.wishlist ?? null;
  const aura = bundle?.aura ?? null;
  const streak = bundle?.streak ?? null;
  const invite = bundle?.invite ?? null;
  const [streakOpen, setStreakOpen] = useState(false);
  const [open, setOpen] = useState<WishlistItem | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (invite?.eligible && !invite.accepted) setInviteOpen(true);
  }, [invite?.eligible, invite?.accepted]);

  useEffect(() => {
    if (isError) toast.error("Wishlist unavailable");
  }, [isError]);

  useEffect(() => {
    const purchaseId = new URLSearchParams(window.location.search).get("streakPurchase");
    if (purchaseId) {
      void tgApi<{ status: string; streak: StreakStatus }>(`/api/v1/streak/purchases/${purchaseId}/status`)
        .then((result) => {
          queryClient.setQueryData<WishlistBundle>(["tg-wishlist", params.slug], (prev) =>
            prev ? { ...prev, streak: result.streak } : prev,
          );
          setStreakOpen(true);
          if (result.status === "PAID") toast.success("Streak day secured");
          const url = new URL(window.location.href);
          url.searchParams.delete("streakPurchase");
          url.searchParams.delete("order_id");
          window.history.replaceState({}, "", url.pathname);
        })
        .catch(() => toast.error("Could not confirm streak payment"));
    }
  }, [params.slug, queryClient]);

  async function acceptInvite() {
    setAccepting(true);
    try {
      const result = await tgApi<{ alreadyAccepted: boolean; awarded: number }>(
        `/api/v1/creators/${wishlist?.slug ?? params.slug}/invite/accept`,
        { method: "POST", body: "{}" },
      );
      if (result.awarded > 0) {
        toast.success(`+${result.awarded} Aura`);
        void confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
      }
      void queryClient.invalidateQueries({ queryKey: ["tg-wishlist", params.slug] });
      setInviteOpen(false);
    } catch {
      toast.error("Could not accept invitation");
    } finally {
      setAccepting(false);
    }
  }

  function giftThis(item: WishlistItem) {
    if (!wishlist || item.available === 0) return;
    router.push(`/tg/checkout?creator=${wishlist.id}&variant=${item.variantId}&slug=${wishlist.slug}`);
  }

  if (isLoading || !wishlist) {
    return (
      <TgPage className="flex h-[calc(var(--tg-viewport-height,100dvh)-7.25rem-env(safe-area-inset-bottom))] flex-col gap-3 !pb-1">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-2.5 w-full" />
          </div>
          <Skeleton className="h-12 w-12 rounded-2xl" />
        </div>
        <Skeleton className="mx-auto mt-2 aspect-[4/5] w-[78%] max-h-full flex-1 rounded-[1.75rem]" />
      </TgPage>
    );
  }

  const firstName = (account?.displayName || "there").split(" ")[0] ?? "there";
  const initial = firstName.slice(0, 1).toUpperCase();
  const segments = 10;
  const filled = Math.round(((aura?.progressPercent ?? 0) / 100) * segments);

  const hasGifts = wishlist.items.length > 0;

  return (
    <TgPage className="flex h-[calc(var(--tg-viewport-height,100dvh)-7.25rem-env(safe-area-inset-bottom))] flex-col gap-3 !pb-1">
      <WishlistTour
        slug={params.slug}
        enabled={hasGifts}
        paused={inviteOpen}
        creatorName={wishlist.displayName}
      />
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3" data-tour="wishlist-greeting">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" decoding="async" className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white/20" />
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
          data-tour="wishlist-streak"
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
        <p className="px-1 text-center text-sm">
          <RainbowText trigger="loop" speed={2.6} bandWidth={50} color="rgba(250, 245, 238, 0.45)">
            You&apos;re in {invite.creatorName ?? "this creator"}&apos;s circle
          </RainbowText>
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
        <div className="relative -mx-5 min-h-0 flex-1" data-tour="wishlist-gallery-frame">
          <CircularGallery
            items={wishlist.items.map((item) => ({
              image: item.imageUrl || GIFT_PLACEHOLDER,
              text: item.productName,
              alt: item.productName,
            }))}
            bend={0.8}
            itemSize={1}
            itemAspect={0.8}
            gap={0.04}
            borderRadius={0.06}
            wave={0.35}
            fadeEdges={0.02}
            shadow={0.4}
            showTitles={false}
            textColor="#faf5ee"
            scrollEase={0.22}
            scrollSpeed={1.35}
            openOnClick={false}
            onItemClick={(_item, index) => setOpen(wishlist.items[index] ?? null)}
            renderOverlay={(_item, index) => {
              const item = wishlist.items[index];
              if (!item) return null;
              const soldOut = item.available === 0;
              return (
                <>
                  <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                    {item.type === "DIGITAL" ? "Virtual" : "Physical"}
                  </span>
                  <div className="absolute inset-x-3 bottom-4">
                    <button
                      type="button"
                      disabled={soldOut}
                      onClick={() => giftThis(item)}
                      className="pointer-events-auto w-full rounded-full border border-white/40 bg-white/20 py-3 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-xl [text-shadow:0_1px_2px_rgba(0,0,0,0.55)] disabled:opacity-40"
                    >
                      {soldOut ? "Sold out" : "Gift this"}
                    </button>
                  </div>
                </>
              );
            }}
          />
          <div
            data-tour="wishlist-gift-anchor"
            className="pointer-events-none absolute inset-x-[12%] bottom-[11%] z-0 h-12 rounded-full opacity-0"
            aria-hidden
          />
        </div>
      )}

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
