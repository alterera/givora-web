"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

export function Unwrap({ from, message, product, onDone }: { from: string; message: string; product: string; onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const steps = reduce ? [0] : [600, 1400, 2400];
    const timers = steps.map((delay, index) => window.setTimeout(() => setPhase(reduce ? 3 : index + 1), delay));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section className="bg-ink px-5 py-12 text-center text-paper">
      <motion.div className="mx-auto mb-6 h-24 w-36 rounded-2xl bg-gold" animate={{ y: phase > 0 ? -8 : 0 }} />
      {phase >= 1 && <p className="text-sm uppercase tracking-[0.2em]">From {from}</p>}
      {phase >= 2 && <h1 className="font-serif mt-4 text-3xl">“{message || "A gift for you"}”</h1>}
      {phase >= 3 && (
        <div className="mt-6">
          <p>{product}</p>
          <button type="button" className="mt-6 rounded-full bg-paper px-5 py-3 text-ink" onClick={onDone}>
            Continue
          </button>
        </div>
      )}
    </section>
  );
}
