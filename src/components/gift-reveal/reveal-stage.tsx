"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import type { RevealGift } from "@/lib/types";
import { api } from "@/lib/api";

export function RevealStage({ token, gift }: { token: string; gift: RevealGift }) {
  const [phase, setPhase] = useState(0);
  const cinematic = gift.theme === "cinematic";

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = (reduce ? [0] : [700, 1800, 3200]).map((delay, index, list) =>
      window.setTimeout(() => setPhase(reduce ? 3 : index + 1), delay, list),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase < 3) return;
    void api(`/api/v1/public/gifts/${token}/opened`, { method: "POST" }).catch(() => undefined);
    if (gift.theme === "playful") {
      void confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
    if (navigator.vibrate) navigator.vibrate(20);
  }, [phase, token, gift.theme]);

  return (
    <section className={`min-h-[70vh] px-5 py-16 ${cinematic ? "bg-ink text-paper" : "bg-paper text-ink"}`}>
      <div className="mx-auto max-w-xl text-center">
        <motion.div
          initial={{ rotate: -8, y: 20 }}
          animate={phase > 0 ? { rotate: 0, y: 0 } : {}}
          className={`mx-auto mb-8 h-28 w-40 rounded-2xl ${cinematic ? "bg-gold" : "bg-rose"}`}
        />
        {phase >= 1 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm uppercase tracking-[0.25em]">
            A gift from {gift.from}
          </motion.p>
        )}
        {phase >= 2 && <motion.h1 className="font-serif mt-6 text-4xl">“{gift.message}”</motion.h1>}
        {phase >= 3 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            {gift.items.map((item) => (
              <p key={item.productName} className="text-lg">
                {item.productName}
                {item.variantName !== "Standard" ? ` · ${item.variantName}` : ""}
              </p>
            ))}
            {gift.status === "READY_TO_SEND" ? (
              <Link href={`/g/${token}/claim`} className="mt-8 inline-flex rounded-full bg-paper px-6 py-3 text-ink">
                Claim your gift
              </Link>
            ) : (
              <p className="mt-6 text-sm opacity-70">This gift is {gift.status.replaceAll("_", " ").toLowerCase()}.</p>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
