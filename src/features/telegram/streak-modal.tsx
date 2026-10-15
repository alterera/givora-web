"use client";

import { useEffect, useState } from "react";
import { Check, Flame, X } from "lucide-react";
import { toast } from "sonner";
import { SpringSlider } from "@/components/ui/spring-slider";
import { formatInr } from "@/lib/money";
import { ApiError } from "@/lib/api";
import { tgApi } from "@/lib/tg-api";
import { startRedirectCheckout } from "@/lib/cashfree-telegram-checkout";

export type StreakStatus = {
  creatorName: string;
  days: number;
  active: boolean;
  pricePaise: number;
  activeUntil: string | null;
  week: Array<{ label: string; date: string; state: "done" | "today" | "upcoming" | "missed" }>;
};

function remainingPercent(activeUntil: string | null) {
  if (!activeUntil) return 0;
  const end = new Date(activeUntil).getTime();
  const start = end - 86_400_000;
  const now = Date.now();
  return Math.max(0, Math.min(100, ((end - now) / (end - start)) * 100));
}

export function StreakModal({
  slug,
  streak,
  onClose,
}: {
  slug: string;
  streak: StreakStatus;
  onClose: () => void;
}) {
  const [left, setLeft] = useState(() => remainingPercent(streak.activeUntil));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!streak.active) return;
    const tick = () => setLeft(remainingPercent(streak.activeUntil));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [streak.active, streak.activeUntil]);

  async function buy() {
    setBusy(true);
    try {
      const result = await tgApi<{
        purchaseId: string;
        checkout: { sessionId: string; mode: "sandbox" | "production" };
      }>(`/api/v1/creators/${slug}/streak/checkout`, {
        method: "POST",
        body: JSON.stringify({ channel: "telegram" }),
      });
      await startRedirectCheckout(result.checkout.sessionId, result.checkout.mode, "_self");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not start streak checkout");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-md sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="streak-title"
        className="relative w-full max-w-sm overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#141414]/88 p-5 text-ink shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute -left-8 top-10 h-24 w-24 rounded-full bg-rose/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-8 h-28 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
        <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded-full p-1.5 text-ink/60" aria-label="Close streak">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start justify-between gap-3 pr-8">
          <div className="flex items-center gap-3">
            <span className="relative grid h-11 w-11 place-items-center">
              <span className="absolute inset-0 rounded-full bg-rose/30 blur-md" />
              <Flame className="relative h-7 w-7 fill-rose text-rose" />
            </span>
            <div>
              <p id="streak-title" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
                Streak
              </p>
              <p className="font-serif text-3xl leading-none">
                {streak.days} <span className="text-base tracking-wide">days</span>
              </p>
            </div>
          </div>
          <Flame className="mt-1 h-5 w-5 text-ink/35" aria-hidden />
        </div>

        <p className="mt-3 text-xs leading-relaxed text-ink/60">
          {streak.creatorName ? `With ${streak.creatorName}. ` : ""}
          A paid day keeps this creator’s streak alive until midnight IST.
        </p>

        <div className="mt-5 flex justify-between gap-1">
          {streak.week.map((day) => {
            const done = day.state === "done";
            const today = day.state === "today";
            return (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full ${
                    done
                      ? "bg-emerald-500 text-white"
                      : today
                        ? "border-2 border-emerald-400 text-emerald-300"
                        : "bg-white/10 text-transparent"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : null}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-ink/45">{day.label}</span>
              </div>
            );
          })}
        </div>

        {streak.active ? (
          <div className="mt-5">
            <div className="mb-2 flex items-end justify-between text-xs uppercase tracking-[0.16em] text-ink/50">
              <span>Today</span>
              <span className="tabular-nums">{Math.round(left)}% left</span>
            </div>
            <div className="pointer-events-none" aria-hidden>
              <SpringSlider value={left} min={0} max={100} step={0.1} ticks={false} tone="mint" />
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void buy()}
            className="mt-6 w-full rounded-full bg-ink py-3.5 text-sm font-medium text-paper disabled:opacity-50"
          >
            {busy ? "Opening checkout…" : streak.days > 0 ? `Keep streak · ${formatInr(streak.pricePaise)}` : `Start streak · ${formatInr(streak.pricePaise)}`}
          </button>
        )}
      </div>
    </div>
  );
}

export async function loadStreak(slug: string) {
  return tgApi<StreakStatus>(`/api/v1/creators/${slug}/streak`);
}
