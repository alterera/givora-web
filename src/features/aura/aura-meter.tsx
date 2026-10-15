"use client";

import Link from "next/link";

export type AuraSummary = {
  earnedAura: number;
  tier: { id: string; name: string };
  nextTier: { id: string; name: string; min: number } | null;
  pointsToNext: number;
  progressPercent: number;
};

export function AuraMeter({ aura, compact }: { aura: AuraSummary; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold">Aura</p>
          <p className="font-serif text-2xl leading-tight">
            {aura.earnedAura}
            <span className="ml-2 text-sm font-sans opacity-70">{aura.tier.name}</span>
          </p>
        </div>
        {!compact && (
          <Link href="/tg/aura" className="text-xs font-medium text-rose underline opacity-90">
            Activity
          </Link>
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose/80 to-gold/90 transition-[width] duration-500 ease-out"
          style={{ width: `${aura.progressPercent}%` }}
        />
      </div>
      {aura.nextTier ? (
        <p className="text-xs opacity-70">
          {aura.pointsToNext} Aura to reach <span className="font-medium">{aura.nextTier.name}</span>
        </p>
      ) : (
        <p className="text-xs opacity-70">You&apos;ve reached the highest tier.</p>
      )}
    </div>
  );
}
