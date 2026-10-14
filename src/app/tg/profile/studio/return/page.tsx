"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { tgApi } from "@/lib/tg-api";
import { telegramApp } from "@/features/telegram/webapp";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";

function ReturnInner() {
  const params = useSearchParams();
  const purchaseId = params.get("purchaseId");
  const [headline, setHeadline] = useState("Confirming purchase");
  const [detail, setDetail] = useState("We verify payment with Cashfree.");

  useEffect(() => {
    if (!purchaseId) return;
    let attempts = 0;
    const poll = () => {
      attempts += 1;
      void tgApi<{ status: string; owned: boolean }>(
        `/api/v1/aura/cosmetics/purchases/${encodeURIComponent(purchaseId)}/status`,
      )
        .then((result) => {
          if (result.status === "PAID" && result.owned) {
            setHeadline("Cosmetic unlocked");
            setDetail("Open Aura Studio to equip your new look.");
            telegramApp()?.HapticFeedback.impactOccurred("medium");
            void confetti({ particleCount: 50, spread: 55, origin: { y: 0.6 } });
            clearInterval(timer);
            return;
          }
          if (result.status === "FAILED") {
            setHeadline("Payment did not go through");
            setDetail("You can try again from Aura Studio.");
            clearInterval(timer);
          }
        })
        .catch(() => {
          if (attempts > 8) setDetail("If you already paid, keep this page open for a moment.");
        });
    };
    poll();
    const timer = setInterval(poll, 4000);
    return () => clearInterval(timer);
  }, [purchaseId]);

  if (!purchaseId) {
    return (
      <TgPage className="text-center">
        <h1 className="font-serif text-3xl">No purchase found</h1>
      </TgPage>
    );
  }

  return (
    <TgPage className="space-y-6 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-gold">Aura Studio</p>
        <h1 className="font-serif mt-2 text-3xl">{headline}</h1>
        <p className="mt-3 text-sm opacity-80">{detail}</p>
      </div>
      <TgCard className="text-left text-xs opacity-80">
        Purchased cosmetics are visual only and do not change earned Aura or creator rankings.
      </TgCard>
      <Link className="text-sm underline opacity-80" href="/tg/profile/studio">
        Back to Studio
      </Link>
    </TgPage>
  );
}

export default function StudioReturnPage() {
  return (
    <Suspense>
      <ReturnInner />
    </Suspense>
  );
}
