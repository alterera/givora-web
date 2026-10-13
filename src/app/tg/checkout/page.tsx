"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError, idempotencyKey } from "@/lib/api";
import { formatInr } from "@/lib/money";
import { tgApi } from "@/lib/tg-api";
import { telegramApp } from "@/features/telegram/webapp";
import { Field, TextArea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type WishlistItem = {
  variantId: string;
  productName: string;
  pricePaise: number;
  shippingPaise: number;
  type: string;
};

type Wishlist = {
  id: string;
  displayName: string;
  items: WishlistItem[];
};

function CheckoutBody() {
  const router = useRouter();
  const search = useSearchParams();
  const creatorId = search.get("creator") ?? "";
  const variantId = search.get("variant") ?? "";
  const slug = search.get("slug") ?? "";
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [line, setLine] = useState<{ productName: string; pricePaise: number; shippingPaise: number } | null>(null);
  const [creatorName, setCreatorName] = useState("");
  const [resolvedCreatorId, setResolvedCreatorId] = useState(creatorId);

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

  async function pay() {
    const id = resolvedCreatorId || creatorId;
    if (!id || !variantId) {
      toast.error("Missing gift details. Open checkout from a wishlist item.");
      return;
    }
    setBusy(true);
    try {
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
      const checkout = await tgApi<{ checkout: { sessionId: string; mode: "sandbox" | "production" } }>(
        `/api/v1/orders/${order.id}/checkout`,
        {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey("pay") },
          body: JSON.stringify({ phone, channel: "telegram" }),
        },
      );
      telegramApp()?.requestWriteAccess((granted) => {
        if (granted) void tgApi("/api/v1/me/telegram/write-access", { method: "POST" });
      });
      const { load } = await import("@cashfreepayments/cashfree-js");
      const cashfree = await load({ mode: checkout.checkout.mode });
      try {
        await cashfree.checkout({ paymentSessionId: checkout.checkout.sessionId, redirectTarget: "_self" });
      } catch {
        telegramApp()?.openLink(`${window.location.origin}/tg/return`);
        toast("If UPI does not open here, complete payment in the browser.");
      }
      router.push(`/tg/return?orderId=${order.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  if (!slug || !variantId) {
    return <p className="px-5 py-8 text-sm opacity-70">Pick a gift from a creator wishlist to check out.</p>;
  }

  const total = line ? line.pricePaise + line.shippingPaise : null;

  return (
    <div className="space-y-4 px-5 py-8">
      <h1 className="font-serif text-4xl">Pay for this gift</h1>
      {line ? (
        <div className="rounded-3xl bg-white p-4">
          <p className="text-sm text-gold">{creatorName}</p>
          <p className="font-serif text-2xl">{line.productName}</p>
          <p className="mt-2 text-sm">
            {formatInr(line.pricePaise)}
            {line.shippingPaise ? ` + ${formatInr(line.shippingPaise)} shipping` : " · shipping free"}
          </p>
          {total !== null && <p className="mt-2 font-medium">Total {formatInr(total)}</p>}
        </div>
      ) : (
        <p className="text-sm opacity-70">Loading gift…</p>
      )}
      <p className="text-sm opacity-70">The creator receives the product, not the money. Their address stays private.</p>
      <TextArea label="Note to the creator" value={message} onChange={(event) => setMessage(event.target.value)} />
      <Field label="Mobile for the payment receipt" value={phone} onChange={(event) => setPhone(event.target.value)} />
      <Button type="button" disabled={busy || !line} onClick={() => void pay()}>
        {busy ? "Opening payment…" : "Pay"}
      </Button>
    </div>
  );
}

export default function TelegramCheckout() {
  return (
    <Suspense fallback={<p className="px-5 py-8">Loading checkout…</p>}>
      <CheckoutBody />
    </Suspense>
  );
}
