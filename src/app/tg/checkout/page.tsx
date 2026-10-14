"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError, idempotencyKey } from "@/lib/api";
import { tryCashfreeInMiniApp } from "@/lib/cashfree-telegram-checkout";
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
  const [launchCheckout, setLaunchCheckout] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [statusHint, setStatusHint] = useState<string | null>(null);

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
    if (!launchCheckout || !payCtx) return;
    let cancelled = false;
    const run = async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      if (cancelled) return;
      const fallbackTimer = window.setTimeout(() => setShowFallback(true), 8_000);
      const result = await tryCashfreeInMiniApp(payCtx.sessionId, payCtx.mode, inlineRef);
      window.clearTimeout(fallbackTimer);
      if (!result.ok) {
        setShowFallback(true);
        setStatusHint("Checkout did not load inside Telegram. Use the secure page below.");
        return;
      }
      setStatusHint(
        result.mode === "inline"
          ? "Complete payment below. Some UPI apps may open outside Telegram."
          : "Follow the payment steps on screen.",
      );
      setShowFallback(true);
      setBusy(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [launchCheckout, payCtx]);

  useEffect(() => {
    if (!payCtx) return;
    const timer = window.setInterval(() => {
      void tgApi<{ orderStatus: string }>(`/api/v1/payments/orders/${payCtx.orderId}/status`)
        .then((result) => {
          if (result.orderStatus === "CONFIRMED") {
            setStatusHint("Payment confirmed.");
            router.replace(`/tg/return?orderId=${payCtx.orderId}`);
          }
        })
        .catch(() => undefined);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [payCtx, router]);

  async function pay() {
    const id = resolvedCreatorId || creatorId;
    if (!id || !variantId) {
      toast.error("Missing gift details. Open checkout from a wishlist item.");
      return;
    }
    setBusy(true);
    setShowFallback(false);
    setStatusHint(null);
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
      const ctx: PayContext = {
        orderId: order.id,
        sessionId: checkout.checkout.sessionId,
        mode: checkout.checkout.mode,
        hostedUrl: checkout.checkout.hostedUrl,
      };
      setPayCtx(ctx);
      setStatusHint("Opening secure payment…");
      setLaunchCheckout(true);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Checkout failed");
      setShowFallback(true);
      setBusy(false);
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
            className="min-h-[22rem] w-full overflow-hidden rounded-3xl border border-[var(--tg-hint-color,rgba(28,25,21,0.12))] bg-[var(--tg-secondary-bg-color,#fff)]"
          />
          {(showFallback || statusHint) && (
            <TgCard className="space-y-3 text-sm">
              <p className="opacity-90">
                If payment does not appear or UPI does not open, use a secure page outside the Mini App. Your gift stays
                pending until we confirm payment.
              </p>
              <Button type="button" onClick={openExternal}>
                Open secure payment page
              </Button>
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
