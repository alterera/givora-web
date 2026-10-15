"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ShieldCheck, Sparkles, Lock, ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { ApiError, idempotencyKey } from "@/lib/api";
import { getCashfree, startRedirectCheckout } from "@/lib/cashfree-telegram-checkout";
import { openCashfreeCheckout } from "@/lib/open-cashfree-checkout";
import { formatInr } from "@/lib/money";
import { tgApi } from "@/lib/tg-api";
import { telegramApp } from "@/features/telegram/webapp";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";
import { Field, TextArea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type WishlistItem = {
  variantId: string;
  productName: string;
  description?: string;
  pricePaise: number;
  shippingPaise: number;
  imageUrl?: string | null;
  type?: string;
};

type Wishlist = {
  id: string;
  displayName: string;
  slug: string;
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
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [line, setLine] = useState<WishlistItem | null>(null);
  const [creatorName, setCreatorName] = useState("");
  const [resolvedCreatorId, setResolvedCreatorId] = useState(creatorId);
  const [payCtx, setPayCtx] = useState<PayContext | null>(null);

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
      setLine(item);
    });
  }, [slug, variantId]);

  async function launchFullScreen(ctx: PayContext) {
    const result = await startRedirectCheckout(ctx.sessionId, ctx.mode, "_self");
    if (result?.error) {
      toast("Payment was not completed.");
      setBusy(false);
      return;
    }
    if (result?.redirect) {
      return;
    }
    if (result?.paymentDetails) {
      router.push(`/tg/return?orderId=${ctx.orderId}`);
    }
  }

  async function pay() {
    const id = resolvedCreatorId || creatorId;
    if (!id || !variantId) {
      toast.error("Missing gift details. Open checkout from a wishlist item.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Enter your mobile number for the payment receipt.");
      return;
    }
    setBusy(true);
    try {
      telegramApp()?.requestWriteAccess((granted) => {
        if (granted) void tgApi("/api/v1/me/telegram/write-access", { method: "POST" });
      });
      if (payCtx) {
        await launchFullScreen(payCtx);
        return;
      }
      const order = await tgApi<{ id: string }>("/api/v1/orders", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey("order") },
        body: JSON.stringify({
          creatorId: id,
          message,
          contactPhone: phone.trim(),
          channel: "telegram",
          items: [{ variantId, quantity: 1 }],
        }),
      });
      const checkout = await tgApi<{
        checkout: { sessionId: string; mode: "sandbox" | "production"; hostedUrl: string };
      }>(`/api/v1/orders/${order.id}/checkout`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey("pay") },
        body: JSON.stringify({ phone: phone.trim(), channel: "telegram" }),
      });
      const ctx: PayContext = {
        orderId: order.id,
        sessionId: checkout.checkout.sessionId,
        mode: checkout.checkout.mode,
        hostedUrl: checkout.checkout.hostedUrl,
      };
      setPayCtx(ctx);
      await launchFullScreen(ctx);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Checkout failed");
      setBusy(false);
    }
  }

  function openExternal() {
    if (!payCtx) return;
    openCashfreeCheckout(payCtx.hostedUrl);
    router.push(`/tg/return?orderId=${payCtx.orderId}`);
  }

  if (!slug || !variantId) {
    return (
      <TgPage className="space-y-4">
        <p className="text-sm opacity-70">Pick a gift from a creator wishlist to check out.</p>
        <Link href="/tg" className="inline-flex items-center gap-2 text-sm font-medium underline">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </TgPage>
    );
  }

  const total = line ? line.pricePaise + line.shippingPaise : null;

  return (
    <TgPage className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href={`/tg/w/${slug}`}
          className="glass-subtle inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-ink/85 transition hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Wishlist
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-gold">
          <Sparkles className="h-3.5 w-3.5" />
          Direct Gift
        </span>
      </div>

      <div>
        <h1 className="font-serif text-3xl tracking-tight">Send this gift</h1>
        <p className="mt-1 text-sm opacity-75">
          For <span className="font-medium text-ink">{creatorName || "Creator"}</span> · Address stays private
        </p>
      </div>

      {line ? (
        <TgCard className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-block rounded-full bg-gold/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-gold">
                {line.type === "DIGITAL" ? "Digital Gift" : "Physical Gift"}
              </span>
              <h2 className="font-serif mt-2 text-2xl leading-snug">{line.productName}</h2>
            </div>
            <p className="font-serif text-2xl font-medium">{formatInr(line.pricePaise)}</p>
          </div>

          <div className="space-y-1.5 border-t border-ink/10 pt-3 text-sm">
            <div className="flex justify-between opacity-75">
              <span>Item price</span>
              <span>{formatInr(line.pricePaise)}</span>
            </div>
            <div className="flex justify-between opacity-75">
              <span>Delivery & fulfilment</span>
              <span>{line.shippingPaise ? formatInr(line.shippingPaise) : "Free"}</span>
            </div>
            {total !== null && (
              <div className="flex justify-between pt-1.5 text-base font-semibold">
                <span>Total payable</span>
                <span>{formatInr(total)}</span>
              </div>
            )}
          </div>
        </TgCard>
      ) : (
        <div className="space-y-3 rounded-[1.75rem] border border-white/10 p-5">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
        </div>
      )}

      <TgCard className="space-y-4 p-5">
        <TextArea
          label={`Note for ${creatorName || "the creator"} (optional)`}
          placeholder="Write a warm message to go with your gift…"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={busy || Boolean(payCtx)}
        />
        <Field
          label="Mobile number for payment receipt"
          placeholder="10-digit mobile number"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          disabled={busy || Boolean(payCtx)}
        />
      </TgCard>

      <div className="space-y-3 pt-1">
        <Button
          type="button"
          className="w-full py-4 text-base font-medium shadow-md"
          disabled={busy || !line}
          onClick={() => void pay()}
        >
          {busy
            ? "Opening Cashfree Checkout…"
            : total !== null
              ? `Pay ${formatInr(total)}`
              : "Pay now"}
        </Button>

        {payCtx && (
          <div className="glass-subtle flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-xs">
            <button
              type="button"
              onClick={openExternal}
              className="inline-flex items-center gap-1.5 font-medium text-ink underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in external browser
            </button>
            <Link href={`/tg/return?orderId=${payCtx.orderId}`} className="font-medium text-gold underline">
              Check status
            </Link>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 pt-1 text-xs opacity-65">
          <span className="inline-flex items-center gap-1">
            <Lock className="h-3.5 w-3.5" /> 100% Secure Checkout
          </span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> UPI · Cards · NetBanking
          </span>
        </div>
      </div>
    </TgPage>
  );
}

export default function TelegramCheckout() {
  return (
    <Suspense fallback={<TgPage className="space-y-3 pt-4"><Skeleton className="h-8 w-24" /><Skeleton className="h-48 w-full rounded-2xl" /></TgPage>}>
      <CheckoutBody />
    </Suspense>
  );
}
