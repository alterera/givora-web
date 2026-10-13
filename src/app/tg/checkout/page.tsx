"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError, idempotencyKey } from "@/lib/api";
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
      await tgApi<{ telegramPayment?: { sent: boolean } }>(`/api/v1/orders/${order.id}/checkout`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey("pay") },
        body: JSON.stringify({ phone, channel: "telegram" }),
      });
      toast.success("Payment QR sent in your Telegram chat");
      router.push(`/tg/return?orderId=${order.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  if (!slug || !variantId) {
    return (
      <TgPage>
        <p className="text-sm opacity-70">Pick a gift from a creator wishlist to check out.</p>
      </TgPage>
    );
  }

  const total = line ? line.pricePaise + line.shippingPaise : null;

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
      <TgCard className="text-sm leading-relaxed opacity-90">
        We send a <strong>UPI QR code</strong> in your chat with GivoraWorldBot. Scan it with GPay, PhonePe, or Paytm — no browser checkout.
      </TgCard>
      <TextArea label="Note to the creator" value={message} onChange={(event) => setMessage(event.target.value)} />
      <Field label="Mobile for the payment receipt" value={phone} onChange={(event) => setPhone(event.target.value)} />
      <Button type="button" disabled={busy || !line} onClick={() => void pay()}>
        {busy ? "Sending payment QR…" : "Send payment QR in Telegram"}
      </Button>
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
