"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError, idempotencyKey } from "@/lib/api";
import { tgApi } from "@/lib/tg-api";
import { telegramApp } from "@/features/telegram/webapp";
import { Field, TextArea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function TelegramCheckout() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  async function pay() {
    const raw = localStorage.getItem("givora-cart");
    if (!raw) return;
    const cart = JSON.parse(raw) as { creatorId: string; items: Array<{ variantId: string }> };
    setBusy(true);
    try {
      const counts = new Map<string, number>();
      for (const item of cart.items) counts.set(item.variantId, (counts.get(item.variantId) ?? 0) + 1);
      const order = await tgApi<{ id: string }>("/api/v1/orders", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey("order") },
        body: JSON.stringify({
          creatorId: cart.creatorId,
          message,
          contactPhone: phone,
          channel: "telegram",
          items: [...counts.entries()].map(([variantId, quantity]) => ({ variantId, quantity })),
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
      localStorage.removeItem("givora-cart");
      router.push(`/tg/return?orderId=${order.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 px-5 py-8">
      <h1 className="font-serif text-4xl">Pay for this gift</h1>
      <p className="text-sm opacity-70">The creator receives the product, not the money. Their address stays private.</p>
      <TextArea label="Note to the creator" value={message} onChange={(event) => setMessage(event.target.value)} />
      <Field label="Mobile for the payment receipt" value={phone} onChange={(event) => setPhone(event.target.value)} />
      <Button type="button" disabled={busy} onClick={() => void pay()}>
        {busy ? "Opening payment…" : "Pay"}
      </Button>
    </div>
  );
}
