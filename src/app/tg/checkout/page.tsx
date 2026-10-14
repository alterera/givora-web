"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError, idempotencyKey } from "@/lib/api";
import {
  getCashfree,
  startInlineCheckout,
  startModalCheckout,
  startRedirectCheckout,
} from "@/lib/cashfree-telegram-checkout";
import { openCashfreeCheckout } from "@/lib/open-cashfree-checkout";
import { formatInr } from "@/lib/money";
import { tgApi } from "@/lib/tg-api";
import { telegramApp } from "@/features/telegram/webapp";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";
import { Field, TextArea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type WishlistItem = {
  variantId: string;
  productName: string;
  pricePaise: number;
  shippingPaise: number;
};

type Wishlist = {
  id: string;
  displayName: string;
  items: WishlistItem[];
};

type PayContext = {
  orderId: string;
  sessionId: string;
  mode: "sandbox" | "production";
  hostedUrl: string;
};

function CheckoutBody() {
  const router = useRouter();
  const search = useSearchParams();
  const creatorId = search.get("creator") ?? "";
  const variantId = search.get("variant") ?? "";
  const slug = search.get("slug") ?? "";
  const inlineRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [line, setLine] = useState<{ productName: string; pricePaise: number; shippingPaise: number } | null>(null);
  const [creatorName, setCreatorName] = useState("");
  const [resolvedCreatorId, setResolvedCreatorId] = useState(creatorId);
  const [payCtx, setPayCtx] = useState<PayContext | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [statusHint, setStatusHint] = useState<string | null>(null);

  useEffect(() => {
    void getCashfree("production");
  }, []);

  useEffect(() => {
    if (!slug || !variantId) return;
    void tgApi<Wishlist>(`/api/v1/creators/${slug}`).then((wishlist) => {
      const item = wishlist.items.find((i) => i.variantId === variantId);
      if (!item) {
        toast.error("This gift is no longer on the wishlist.");
        return;
      }
      setResolvedCreatorId(wishlist.id);
      setCreatorName(wishlist.displayName);
      setLine({
        productName: item.productName,
        pricePaise: item.pricePaise,
        shippingPaise: item.shippingPaise,
      });
    });
  }, [slug, variantId]);

  useEffect(() => {
    if (!payCtx) return;
    let cancelled = false;

    const verifyBackendStatus = async () => {
      try {
        const result = await tgApi<{ orderStatus: string; status: string }>(
          `/api/v1/payments/orders/${payCtx.orderId}/status`,
        );
        if (cancelled) return;
        if (result.orderStatus === "CONFIRMED") {
          setStatusHint("Payment confirmed.");
          router.replace(`/tg/return?orderId=${payCtx.orderId}`);
        }
      } catch {
        // Ignore transient polling errors while awaiting webhook/bank
      }
    };

    const runInline = async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      if (cancelled) return;
      const container = inlineRef.current;
      if (!container) {
        setShowFallback(true);
        setBusy(false);
        return;
      }
      setBusy(false);
      setStatusHint("Complete payment below inside the app.");
      const fallbackTimer = window.setTimeout(() => {
        if (!cancelled) setShowFallback(true);
      }, 4000);

      try {
        const result = await startInlineCheckout(payCtx.sessionId, payCtx.mode, container);
        window.clearTimeout(fallbackTimer);
        if (cancelled) return;

        if (result?.error) {
          setShowFallback(true);
          setStatusHint("Payment was not completed. You can retry below or open the full-screen checkout.");
          return;
        }
        if (result?.redirect) {
          return;
        }
        if (result?.paymentDetails) {
          setStatusHint("Verifying payment with server…");
          await verifyBackendStatus();
          router.push(`/tg/return?orderId=${payCtx.orderId}`);
        }
      } catch {
        window.clearTimeout(fallbackTimer);
        if (!cancelled) {
          setShowFallback(true);
          setStatusHint("Checkout could not load inline. Tap below to open full-screen payment.");
        }
      }
    };

    void runInline();
    const timer = window.setInterval(() => void verifyBackendStatus(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [payCtx, router]);

  async function pay() {
    const id = resolvedCreatorId || creatorId;
    if (!id || !variantId) {
      toast.error("Missing gift details. Open checkout from a wishlist item.");
      return;
    }
    setBusy(true);
    setShowFallback(false);
    setStatusHint("Creating order…");
    try {
      telegramApp()?.requestWriteAccess((granted) => {
        if (granted) void tgApi("/api/v1/me/telegram/write-access", { method: "POST" });
      });
      const order = await tgApi<{ id: string }>("/api/v1/orders", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey("order") },
        body: JSON.stringify({
          creatorId: id,
          message,
          contactPhone: phone,
          channel: "telegram",
          items: [{ variantId, quantity: 1 }],
        }),
      });
      const checkout = await tgApi<{
        checkout: { sessionId: string; mode: "sandbox" | "production"; hostedUrl: string };
      }>(`/api/v1/orders/${order.id}/checkout`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey("pay") },
        body: JSON.stringify({ phone, channel: "telegram" }),
      });
      setPayCtx({
        orderId: order.id,
        sessionId: checkout.checkout.sessionId,
        mode: checkout.checkout.mode,
        hostedUrl: checkout.checkout.hostedUrl,
      });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Checkout failed");
      setStatusHint(null);
      setBusy(false);
    }
  }

  async function openInAppModal() {
    if (!payCtx) return;
    setStatusHint("Opening payment popup…");
    const result = await startModalCheckout(payCtx.sessionId, payCtx.mode);
    if (result?.error) {
      toast("Payment was not completed.");
      setStatusHint("Payment was not completed. Try again or open in browser.");
      return;
    }
    if (result?.redirect) return;
    if (result?.paymentDetails) {
      router.push(`/tg/return?orderId=${payCtx.orderId}`);
    }
  }

  async function openInAppRedirect() {
    if (!payCtx) return;
    setStatusHint("Redirecting to Cashfree checkout…");
    const result = await startRedirectCheckout(payCtx.sessionId, payCtx.mode, "_self");
    if (result?.error) {
      openExternal();
    }
  }

  function openExternal() {
    if (!payCtx) return;
    openCashfreeCheckout(payCtx.hostedUrl);
    setStatusHint("Finish payment in your browser, then return here.");
    router.push(`/tg/return?orderId=${payCtx.orderId}`);
  }

  if (!slug || !variantId) {
    return (
      <TgPage>
        <p className="text-sm opacity-70">Pick a gift from a creator wishlist to check out.</p>
      </TgPage>
    );
  }

  const total = line ? line.pricePaise + line.shippingPaise : null;
  const formLocked = busy || Boolean(payCtx);

  return (
    <TgPage className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-gold">Checkout</p>
        <h1 className="font-serif mt-2 text-3xl">Pay for this gift</h1>
      </div>
      {line ? (
        <TgCard>
          <p className="text-sm text-gold">{creatorName}</p>
          <p className="font-serif text-2xl">{line.productName}</p>
          <p className="mt-2 text-sm opacity-80">
            {formatInr(line.pricePaise)}
            {line.shippingPaise ? ` + ${formatInr(line.shippingPaise)} shipping` : " · shipping free"}
          </p>
          {total !== null && <p className="mt-2 font-medium">Total {formatInr(total)}</p>}
        </TgCard>
      ) : (
        <p className="text-sm opacity-70">Loading gift…</p>
      )}

      {!payCtx && (
        <>
          <TextArea
            label="Note to the creator"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={formLocked}
          />
          <Field
            label="Mobile for the payment receipt"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={formLocked}
          />
          <Button type="button" disabled={busy || !line} onClick={() => void pay()}>
            {busy ? "Starting payment…" : "Pay"}
          </Button>
        </>
      )}

      {payCtx && (
        <>
          {statusHint && <p className="text-sm opacity-80">{statusHint}</p>}
          <div
            ref={inlineRef}
            id="cf-inline-checkout"
            className="min-h-[40rem] w-full overflow-hidden rounded-3xl border border-[var(--tg-hint-color,rgba(28,25,21,0.12))] bg-white"
          />
          {showFallback && (
            <TgCard className="space-y-3 text-sm">
              <p className="opacity-90">
                Having trouble with the embedded view? Switch to full-screen checkout inside the app or open in your
                browser for UPI apps.
              </p>
              <div className="flex flex-col gap-2">
                <Button type="button" onClick={() => void openInAppRedirect()}>
                  Open full-screen in app
                </Button>
                <button
                  type="button"
                  className="w-full rounded-full border border-ink/20 px-4 py-3 text-center text-sm font-medium"
                  onClick={() => void openInAppModal()}
                >
                  Open popup modal
                </button>
                <button
                  type="button"
                  className="w-full rounded-full border border-ink/20 px-4 py-3 text-center text-sm font-medium"
                  onClick={openExternal}
                >
                  Open in external browser
                </button>
              </div>
              <Link className="inline-flex text-sm underline opacity-80" href={`/tg/return?orderId=${payCtx.orderId}`}>
                View payment status
              </Link>
            </TgCard>
          )}
        </>
      )}
    </TgPage>
  );
}

export default function TelegramCheckout() {
  return (
    <Suspense fallback={<TgPage><p className="text-sm opacity-70">Loading checkout…</p></TgPage>}>
      <CheckoutBody />
    </Suspense>
  );
}
