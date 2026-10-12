"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

function Poll() {
  const params = useSearchParams();
  const orderId = params.get("order_id") ?? params.get("orderId");
  const [text, setText] = useState("Confirming payment…");
  useEffect(() => {
    if (!orderId) return;
    const timer = setInterval(() => {
      void api<{ orderStatus: string; orderId: string }>(`/api/v1/payments/provider-order/status?orderId=${encodeURIComponent(orderId)}`)
        .then((result) => {
          if (result.orderStatus === "CONFIRMED") {
            setText("Payment confirmed.");
            clearInterval(timer);
          }
        })
        .catch(() => setText("Waiting for the bank."));
    }, 2000);
    return () => clearInterval(timer);
  }, [orderId]);
  return <div className="px-5 py-20 text-center"><h1 className="font-serif text-4xl">{text}</h1></div>;
}

export default function Page() {
  return <Suspense><Poll /></Suspense>;
}
