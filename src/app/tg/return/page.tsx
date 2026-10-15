"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { tgApi } from "@/lib/tg-api";
import { telegramApp } from "@/features/telegram/webapp";
import { Skeleton } from "@/components/ui/skeleton";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";

function ReturnInner() {
  const params = useSearchParams();
  const initialRef = params.get("orderId") ?? params.get("order_id");
  const [resolvedOrderId, setResolvedOrderId] = useState<string | null>(params.get("orderId"));
  const [headline, setHeadline] = useState("Confirming payment");
  const [detail, setDetail] = useState(
    "We verify payment with Cashfree. This may take a few seconds after you pay.",
  );

  useEffect(() => {
    if (!initialRef) return;
    let attempts = 0;
    const poll = () => {
      attempts += 1;
      void tgApi<{ orderId: string; orderStatus: string; status: string }>(
        `/api/v1/payments/orders/${encodeURIComponent(initialRef)}/status`,
      )
        .then((result) => {
          if (result.orderId) setResolvedOrderId(result.orderId);
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
          if (attempts > 8) {
            setDetail("Still waiting for the bank. If you already paid, keep this page open for a minute.");
          }
        });
    };
    poll();
    const timer = setInterval(poll, 4000);
    return () => clearInterval(timer);
  }, [initialRef]);

  if (!initialRef) {
    return (
      <TgPage className="text-center">
        <h1 className="font-serif text-3xl">No order found</h1>
        <p className="mt-3 text-sm opacity-70">Start checkout from a wishlist again.</p>
      </TgPage>
    );
  }

  const giftOrderHref = resolvedOrderId ? `/tg/orders/${resolvedOrderId}` : `/tg/orders`;

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
      <Link className="inline-flex text-sm underline opacity-80" href={giftOrderHref}>
        View this gift
      </Link>
    </TgPage>
  );
}

export default function ReturnPage() {
  return (
    <Suspense fallback={<TgPage className="space-y-3 pt-8"><Skeleton className="mx-auto h-8 w-48" /><Skeleton className="h-24 w-full rounded-2xl" /></TgPage>}>
      <ReturnInner />
    </Suspense>
  );
}
