"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { getCashfree, startRedirectCheckout } from "@/lib/cashfree-telegram-checkout";

function CashfreeLauncher() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("paymentSessionId") ?? "";
  const orderId = params.get("orderId") ?? "";
  const mode = params.get("mode") === "production" ? "production" : "sandbox";
  const [message, setMessage] = useState("Opening secure payment…");
  const started = useRef(false);

  useEffect(() => {
    void getCashfree(mode);
  }, [mode]);

  useEffect(() => {
    if (!sessionId || started.current) return;
    started.current = true;
    void (async () => {
      try {
        const result = await startRedirectCheckout(sessionId, mode, "_self");
        if (result?.error) {
          setMessage("Payment was not completed. Return to Telegram and tap Pay again.");
          return;
        }
        if (result?.redirect) {
          return;
        }
        if (result?.paymentDetails && orderId) {
          router.replace(`/tg/return?orderId=${encodeURIComponent(orderId)}`);
        }
      } catch {
        setMessage("Payment could not start. Return to Telegram and tap Pay again.");
      }
    })();
  }, [sessionId, mode, orderId, router]);

  if (!sessionId) {
    return <p className="text-sm opacity-80">This payment link is incomplete. Start checkout again from GivoraWorld.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm opacity-80">{message}</p>
      <button
        type="button"
        className="rounded-full bg-ink px-5 py-3 text-sm text-paper"
        onClick={() => void startRedirectCheckout(sessionId, mode, "_self")}
      >
        Continue to Cashfree
      </button>
    </div>
  );
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
