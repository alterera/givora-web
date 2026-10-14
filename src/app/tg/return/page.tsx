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
  const orderId = params.get("order_id") ?? params.get("orderId");
  const [headline, setHeadline] = useState("Confirming payment");
  const [detail, setDetail] = useState(
    "We verify payment with Cashfree. This may take a few seconds after you pay.",
  );

  useEffect(() => {
    if (!orderId) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      void tgApi<{ orderStatus: string; status: string }>(`/api/v1/payments/orders/${orderId}/status`)
        .then((result) => {
          if (result.orderStatus === "CONFIRMED") {
            setHeadline("Payment confirmed");
            setDetail("The creator has been notified. Thank you for the gift.");
            telegramApp()?.HapticFeedback.impactOccurred("medium");
            void confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
            clearInterval(timer);
            return;
          }
          if (result.status === "FAILED") {
            setHeadline("Payment did not go through");
            setDetail("You can try again from the wishlist checkout.");
            clearInterval(timer);
          }
        })
        .catch(() => {
          if (attempts > 12) {
            setDetail("Still waiting for the bank. If you already paid, keep this page open for a minute.");
          }
        });
    }, 2000);
    return () => clearInterval(timer);
  }, [orderId]);

  if (!orderId) {
    return (
      <TgPage className="text-center">
        <h1 className="font-serif text-3xl">No order found</h1>
        <p className="mt-3 text-sm opacity-70">Start checkout from a wishlist again.</p>
      </TgPage>
    );
  }

  return (
    <TgPage className="space-y-6 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-gold">Payment</p>
        <h1 className="font-serif mt-2 text-3xl">{headline}</h1>
        <p className="mt-3 text-sm leading-relaxed opacity-80">{detail}</p>
      </div>
      {headline === "Confirming payment" && (
        <TgCard className="text-left text-sm leading-relaxed opacity-90">
          <p>If you paid in another browser tab, return to GivoraWorld and we will update this screen automatically.</p>
        </TgCard>
      )}
      <Link className="inline-flex text-sm underline opacity-80" href={`/tg/orders/${orderId}`}>
        View this gift
      </Link>
    </TgPage>
  );
}

export default function ReturnPage() {
  return (
    <Suspense fallback={<TgPage><p className="text-center text-sm opacity-70">Loading…</p></TgPage>}>
      <ReturnInner />
    </Suspense>
  );
}
