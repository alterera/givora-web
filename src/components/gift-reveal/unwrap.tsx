"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";

export function Unwrap({ from, message, product, onDone }: { from: string; message: string; product: string; onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const steps = reduce ? [0] : [600, 1400, 2400];
    const timers = steps.map((delay, index) => window.setTimeout(() => setPhase(reduce ? 3 : index + 1), delay));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <TgPage className="flex min-h-[70dvh] items-center justify-center">
      <TgCard className="w-full p-8 text-center">
        <motion.div className="mx-auto mb-6 h-24 w-36 rounded-2xl bg-gold shadow-lg" animate={{ y: phase > 0 ? -8 : 0 }} />
        {phase >= 1 && <p className="text-xs uppercase tracking-[0.2em] text-gold">From {from}</p>}
        {phase >= 2 && <h1 className="font-serif mt-4 text-3xl">“{message || "A gift for you"}”</h1>}
        {phase >= 3 && (
          <div className="mt-6">
            <p className="font-medium opacity-85">{product}</p>
            <button type="button" className="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper" onClick={onDone}>
              Unwrap & Redeem
            </button>
          </div>
        )}
      </TgCard>
    </TgPage>
  );
}
