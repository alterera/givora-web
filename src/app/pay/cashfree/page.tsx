"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

function CashfreeLauncher() {
  const params = useSearchParams();
  const sessionId = params.get("paymentSessionId") ?? "";
  const mode = params.get("mode") === "production" ? "production" : "sandbox";
  const [message, setMessage] = useState("Opening secure payment…");
  const started = useRef(false);

  useEffect(() => {
    if (!sessionId || started.current) return;
    started.current = true;
    void (async () => {
      try {
        const { load } = await import("@cashfreepayments/cashfree-js");
        const cashfree = await load({ mode });
        await cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: "_top" });
      } catch {
        setMessage("Payment could not start. Return to Telegram and tap Pay again.");
      }
    })();
  }, [sessionId, mode]);

  if (!sessionId) {
    return <p className="text-sm opacity-80">This payment link is incomplete. Start checkout again from GivoraWorld.</p>;
  }

  return <p className="text-sm opacity-80">{message}</p>;
}

export default function CashfreePayPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-6 text-center text-ink">
      <Suspense fallback={<p className="text-sm opacity-80">Loading…</p>}>
        <CashfreeLauncher />
      </Suspense>
    </div>
  );
}
