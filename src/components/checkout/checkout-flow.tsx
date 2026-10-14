"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, ApiError, idempotencyKey } from "@/lib/api";
import { getCashfree, startRedirectCheckout } from "@/lib/cashfree-telegram-checkout";
import { formatInr } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Field, TextArea } from "@/components/ui/field";

export function CheckoutFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const creatorId = params.get("creator") ?? "";
  const variantId = params.get("variant") ?? "";
  const name = params.get("name") ?? "Gift";
  const creatorName = params.get("creatorName") ?? "this creator";
  const price = Number(params.get("price") ?? 0);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getCashfree("production");
  }, []);

  async function pay() {
    setBusy(true);
    try {
      await api("/api/v1/auth/me");
    } catch {
      toast.error("Verify your WhatsApp number first");
      setBusy(false);
      return;
    }
    if (!creatorId || !variantId) {
      toast.error("Open a creator wishlist and choose a gift from there.");
      setBusy(false);
      return;
    }
    try {
      const order = await api<{ id: string }>("/api/v1/orders", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey("order") },
        body: JSON.stringify({
          creatorId,
          message,
          contactPhone: phone || undefined,
          channel: "web",
          items: [{ variantId, quantity: 1 }],
        }),
      });
      const checkout = await api<{ checkout: { sessionId: string; mode: "sandbox" | "production" } }>(
        `/api/v1/orders/${order.id}/checkout`,
        {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey("pay") },
          body: JSON.stringify({ phone, channel: "web" }),
        },
      );
      const result = await startRedirectCheckout(checkout.checkout.sessionId, checkout.checkout.mode, "_self");
      if (result?.error) {
        toast("Payment was not completed.");
        return;
      }
      if (result?.redirect) {
        return;
      }
      if (result?.paymentDetails) {
        router.push(`/return?orderId=${order.id}`);
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 px-5 py-12">
      <h1 className="font-serif text-4xl">{creatorId ? `Gift ${name} to ${creatorName}` : "Choose a creator first"}</h1>
      {creatorId ? (
        <p>{formatInr(price)}. Shipping is added by the product, on our server. The creator gets the item, not the money.</p>
      ) : (
        <p>Gifts are bought from a creator wishlist. The catalogue on its own cannot be checked out.</p>
      )}
      <TextArea label="Note" value={message} onChange={(event) => setMessage(event.target.value)} />
      <Field label="WhatsApp number" value={phone} onChange={(event) => setPhone(event.target.value)} />
      {sent && <Field label="Code" value={code} onChange={(event) => setCode(event.target.value)} />}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            void (sent
              ? api("/api/v1/auth/otp/verify", { method: "POST", body: JSON.stringify({ phone, code }) })
              : api("/api/v1/auth/otp/request", { method: "POST", body: JSON.stringify({ phone }) })
            )
              .then(() => {
                setSent(true);
                if (sent) toast.success("Signed in");
              })
              .catch((error) => toast.error(error instanceof ApiError ? error.message : "Try again"))
          }
        >
          {sent ? "Verify" : "Send code"}
        </Button>
        <Button type="button" disabled={busy || !creatorId} onClick={() => void pay()}>
          Pay now
        </Button>
      </div>
    </div>
  );
}
