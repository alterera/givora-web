"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { useTelegramSession } from "@/features/telegram/session";
import { TgPage } from "@/features/telegram/tg-shell";
import { AuraMeter, type AuraSummary } from "@/features/aura/aura-meter";
import { tgApi } from "@/lib/tg-api";

type AuraProfile = AuraSummary & {
  milestones: Array<{ key: string; label: string; achievedAt: string }>;
  equipped: {
    frame: { slug: string; name: string; cssClass: string | null } | null;
    effect: { slug: string; name: string; cssClass: string | null } | null;
  } | null;
};

export default function ProfilePage() {
  const { account, photoUrl } = useTelegramSession();
  const [aura, setAura] = useState<AuraProfile | null>(null);

  useEffect(() => {
    void tgApi<AuraProfile>("/api/v1/me/aura").then(setAura).catch(() => setAura(null));
  }, []);

  if (!account) return null;
  const name = account.displayName || "Telegram member";
  const since = new Date(account.createdAt).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const initial = name.slice(0, 1).toUpperCase();
  const frameClass = aura?.equipped?.frame?.cssClass ?? "";
  const effectClass = aura?.equipped?.effect?.cssClass ?? "";

  return (
    <TgPage className="space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.07] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 ${effectClass}`} />
        <div className="relative flex flex-col items-center text-center">
          <div className={frameClass || "rounded-full p-[3px] bg-gradient-to-br from-gold/80 to-rose/70"}>
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-full bg-[#141019] font-serif text-3xl text-ink">
                {initial}
              </div>
            )}
          </div>
          <h1 className="font-serif mt-4 text-4xl">{name}</h1>
          <p className="mt-1 text-sm text-ink/65">
            {account.telegramUsername ? `@${account.telegramUsername}` : "No public username"}
          </p>
          <p className="mt-3 rounded-full bg-white/10 px-3 py-1 text-xs tracking-wide text-ink/75">
            Member since {since}
          </p>
        </div>
      </section>

      {aura && (
        <section className="rounded-[1.75rem] border border-white/12 bg-white/[0.07] p-5 backdrop-blur-2xl">
          <AuraMeter aura={aura} />
          <p className="mt-3 text-xs leading-relaxed text-ink/60">
            Aura is how you show up on GivoraWorld. It never buys a reply or faster delivery.
          </p>
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

      <Link
        href="/tg/profile/studio"
        className="flex items-center justify-between rounded-[1.5rem] border border-white/12 bg-white/[0.07] px-4 py-4 backdrop-blur-2xl"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gold/15 text-gold">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-medium">Aura Studio</span>
            <span className="block text-xs text-ink/60">Frames and effects for your profile</span>
          </span>
        </span>
        <ChevronRight className="h-4 w-4 text-ink/50" />
      </Link>

      <Link
        href="/tg/profile/aura"
        className="flex items-center justify-between rounded-[1.5rem] border border-white/12 bg-white/[0.07] px-4 py-4 backdrop-blur-2xl"
      >
        <span>
          <span className="block text-sm font-medium">Aura activity</span>
          <span className="block text-xs text-ink/60">Invites, gifts, and adjustments</span>
        </span>
        <ChevronRight className="h-4 w-4 text-ink/50" />
      </Link>
    </TgPage>
  );
}
