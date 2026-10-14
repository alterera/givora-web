"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, ExternalLink, Gift, Heart, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";
import { tgApi } from "@/lib/tg-api";

type Profile = {
  slug: string;
  shortCode: string;
  displayName: string;
  bio?: string;
  giftNote?: string;
  status?: string;
  items?: Array<{ wishlistItemId: string }>;
};

export default function CreatorHome() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    void tgApi<Profile>("/api/v1/creators/me")
      .then(setProfile)
      .catch(() => setMissing(true));
  }, []);

  if (missing) {
    return (
      <TgPage className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Creator Studio</p>
        <h1 className="font-serif text-3xl">Creator access</h1>
        <TgCard className="space-y-2 p-5 text-sm leading-relaxed opacity-85">
          <p>
            Creator accounts are activated by the GivoraWorld team after you open this Mini App in Telegram.
          </p>
          <p className="opacity-75">
            Ask an admin to promote your Telegram account from the Givora Admin Panel.
          </p>
        </TgCard>
      </TgPage>
    );
  }

  if (!profile) {
    return (
      <TgPage className="flex min-h-[45dvh] items-center justify-center">
        <p className="text-sm opacity-70">Loading creator studio…</p>
      </TgPage>
    );
  }

  const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT ?? "GivoraWorldBot";
  const telegram = `https://t.me/${bot}?startapp=${profile.shortCode}`;
  const isApproved = profile.status === "APPROVED";
  const itemCount = profile.items?.length ?? 0;

  return (
    <TgPage className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-gold">
          <Sparkles className="h-3.5 w-3.5" /> Creator Studio
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isApproved ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
          }`}
        >
          {isApproved ? "Approved & Live" : "Pending Approval"}
        </span>
      </div>

      <div>
        <h1 className="font-serif text-3xl tracking-tight">{profile.displayName}</h1>
        <p className="mt-1 text-sm opacity-75">
          {isApproved
            ? "Share your direct link so fans can send you gifts privately."
            : "Your wishlist link will go live as soon as an admin approves your profile."}
        </p>
      </div>

      <TgCard className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider opacity-60">Your Telegram Wishlist Link</span>
          <span className="text-xs opacity-60">{itemCount} {itemCount === 1 ? "item" : "items"}</span>
        </div>
        <p className="glass-subtle truncate rounded-2xl px-3.5 py-2.5 font-mono text-xs text-ink/90">{telegram}</p>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-medium text-paper transition active:scale-[0.99]"
            onClick={() =>
              void navigator.clipboard.writeText(telegram).then(() => toast.success("Wishlist link copied"))
            }
          >
            <Copy className="h-3.5 w-3.5" />
            Copy link
          </button>
          <a
            className="glass-subtle inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-medium text-ink transition hover:opacity-90"
            href={`https://t.me/share/url?url=${encodeURIComponent(telegram)}&text=${encodeURIComponent(`Send me a gift on GivoraWorld ✨`)}`}
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </a>
        </div>
        {isApproved && (
          <Link
            className="inline-flex w-full items-center justify-center gap-1.5 pt-1 text-xs font-medium text-gold underline"
            href={`/tg/w/${profile.slug}`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Preview public wishlist
          </Link>
        )}
      </TgCard>

      <div className="grid gap-3">
        <Link href="/tg/creator/wishlist" className="block">
          <TgCard className="flex items-center justify-between p-4 transition hover:opacity-95">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gold/15 text-gold">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Manage wishlist</p>
                <p className="text-xs opacity-70">Add or remove gifts from the catalogue ({itemCount} active)</p>
              </div>
            </div>
            <span className="text-sm opacity-50">→</span>
          </TgCard>
        </Link>

        <Link href="/tg/creator/gifts" className="block">
          <TgCard className="flex items-center justify-between p-4 transition hover:opacity-95">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink/10 text-ink">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Gifts received</p>
                <p className="text-xs opacity-70">Unwrap gifts from fans and enter delivery details</p>
              </div>
            </div>
            <span className="text-sm opacity-50">→</span>
          </TgCard>
        </Link>
      </div>
    </TgPage>
  );
}
