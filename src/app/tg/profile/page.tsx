"use client";

import { useTelegramSession } from "@/features/telegram/session";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";

export default function ProfilePage() {
  const { account, photoUrl } = useTelegramSession();
  if (!account) return null;
  const name = account.displayName || "Telegram member";
  const since = new Date(account.createdAt).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const initial = name.slice(0, 1).toUpperCase();
  return (
    <TgPage>
      <p className="text-sm uppercase tracking-[0.2em] text-gold">Profile</p>
      <div className="mt-8 flex flex-col items-center text-center">
        {photoUrl ? (
          // Telegram profile photos are remote and short-lived.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-24 w-24 rounded-full object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-ink text-3xl text-paper">{initial}</div>
        )}
        <h1 className="font-serif mt-5 text-4xl">{name}</h1>
        <p className="mt-2 text-ink/70">{account.telegramUsername ? `@${account.telegramUsername}` : "No public username"}</p>
        <TgCard className="mt-6 inline-block rounded-full px-4 py-2 text-sm">Member since {since}</TgCard>
      </div>
    </TgPage>
  );
}
