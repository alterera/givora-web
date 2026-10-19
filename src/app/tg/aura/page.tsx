"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AuraMeter } from "@/features/aura/aura-meter";
import { useTgAura } from "@/features/telegram/queries";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";
import { tgApi } from "@/lib/tg-api";

type ActivityItem = {
  id: string;
  amount: number;
  label: string;
  createdAt: string;
};

export default function AuraPage() {
  const { data: aura, isLoading: auraLoading } = useTgAura();
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [extrasReady, setExtrasReady] = useState(false);
  const ready = !auraLoading && extrasReady;

  useEffect(() => {
    void tgApi<{ items: ActivityItem[] }>("/api/v1/me/aura/activity")
      .then((page) => setActivity(page.items.slice(0, 12)))
      .catch(() => setActivity([]))
      .finally(() => setExtrasReady(true));
  }, []);

  return (
    <TgPage className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Aura</p>
        <h1 className="font-serif text-3xl">Your presence</h1>
        <p className="mt-1 text-sm text-ink/65">Earn Aura when you send gifts and accept creator invites.</p>
      </div>

      {!ready && (
        <div className="space-y-3">
          <Skeleton className="h-36 w-full rounded-[1.75rem]" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      )}

      {ready && aura && (
        <section className="rounded-[1.75rem] border border-white/12 bg-white/[0.07] p-5 backdrop-blur-2xl">
          <AuraMeter aura={aura} compact />
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

      {ready && (
        <section className="space-y-2">
          <h2 className="px-1 text-xs uppercase tracking-[0.16em] text-ink/55">Recent activity</h2>
          {activity.length === 0 ? (
            <TgCard className="p-4 text-sm text-ink/70">Send a gift or accept an invite to start earning Aura.</TgCard>
          ) : (
            activity.map((row) => (
              <TgCard key={row.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{row.label}</p>
                  <p className="text-xs text-ink/55">{new Date(row.createdAt).toLocaleString("en-IN")}</p>
                </div>
                <span className={`font-serif text-lg ${row.amount >= 0 ? "text-gold" : "text-rose"}`}>
                  {row.amount >= 0 ? `+${row.amount}` : row.amount}
                </span>
              </TgCard>
            ))
          )}
        </section>
      )}
    </TgPage>
  );
}
