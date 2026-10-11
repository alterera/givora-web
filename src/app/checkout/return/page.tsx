"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";

function ReturnPoll() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get("order_id");
  const [message, setMessage] = useState("Confirming your payment…");

  useEffect(() => {
    if (!orderId) return;
    let stopped = false;
    const timer = setInterval(() => {
      void api<{ giftId: string; giftStatus: string; status: string }>(
        `/api/v1/payments/provider-order/status?orderId=${encodeURIComponent(orderId)}`,
      )
        .then((result) => {
          if (stopped) return;
          if (result.giftStatus === "READY_TO_SEND") {
            clearInterval(timer);
            router.replace(`/gifts/sent/${result.giftId}`);
          } else if (result.status === "FAILED") {
            setMessage("The payment did not complete. You can try the gift again.");
            clearInterval(timer);
          }
        })
        .catch(() => setMessage("Still waiting for the bank to confirm."));
    }, 2000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [orderId, router]);

  return (
    <div className="mx-auto max-w-lg px-5 py-20 text-center">
      <h1 className="font-serif text-4xl">{message}</h1>
    </div>
  );
}

export default function ReturnPage() {
  return (
    <Suspense>
      <ReturnPoll />
    </Suspense>
  );
}
