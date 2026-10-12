"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { tgApi } from "@/lib/tg-api";
import { telegramApp } from "@/features/telegram/webapp";

function ReturnInner() {
  const params = useSearchParams();
  const orderId = params.get("order_id") ?? params.get("orderId");
  const [status, setStatus] = useState("Confirming payment…");

  useEffect(() => {
    if (!orderId) return;
    const timer = setInterval(() => {
      void tgApi<{ orderStatus: string }>(`/api/v1/payments/provider-order/status?orderId=${encodeURIComponent(orderId)}`)
        .then((result) => {
          if (result.orderStatus === "CONFIRMED") {
            setStatus("Payment confirmed. The creator has been notified.");
            telegramApp()?.HapticFeedback.impactOccurred("medium");
            void confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
            clearInterval(timer);
          }
        })
        .catch(() => setStatus("Still waiting for the bank."));
    }, 2000);
    return () => clearInterval(timer);
  }, [orderId]);

  return (
    <div className="px-5 py-16 text-center">
      <h1 className="font-serif text-4xl">{status}</h1>
      {orderId && (
        <a className="mt-6 inline-flex underline" href={`/tg/orders/${orderId}`}>
          View this gift
        </a>
      )}
    </div>
  );
}

export default function ReturnPage() {
  return (
    <Suspense>
      <ReturnInner />
    </Suspense>
  );
}
