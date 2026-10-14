"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useTelegramSession } from "@/features/telegram/session";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";
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

  return (
    <TgPage>
      <p className="text-sm uppercase tracking-[0.2em] text-gold">Profile</p>
      <div className="mt-8 flex flex-col items-center text-center">
        <div className={`relative ${frameClass}`}>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-ink text-3xl text-paper">
              {initial}
            </div>
          )}
        </div>
        <h1 className="font-serif mt-5 text-4xl">{name}</h1>
        <p className="mt-2 text-ink/70">{account.telegramUsername ? `@${account.telegramUsername}` : "No public username"}</p>
        <TgCard className="mt-6 inline-block rounded-full px-4 py-2 text-sm">Member since {since}</TgCard>
      </div>

      {aura && (
        <TgCard className="mt-8 space-y-4 p-5">
          <AuraMeter aura={aura} />
          <p className="text-xs leading-relaxed opacity-65">
            Aura reflects your participation on GivoraWorld. It helps you stand out visually — it does not guarantee a
            creator reply or faster delivery.
          </p>
          {aura.milestones.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {aura.milestones.map((m) => (
                <span key={m.key} className="glass-subtle rounded-full px-3 py-1 text-xs">
                  {m.label}
                </span>
              ))}
            </div>
          )}
          <Link
            href="/tg/profile/studio"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-medium text-paper"
          >
            <Sparkles className="h-4 w-4" />
            Aura Studio
          </Link>
        </TgCard>
      )}
    </TgPage>
  );
}
