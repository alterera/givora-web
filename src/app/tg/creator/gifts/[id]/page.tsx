"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Truck } from "lucide-react";
import { toast } from "sonner";
import { ApiError, idempotencyKey } from "@/lib/api";
import { tgApi } from "@/lib/tg-api";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";
import { Unwrap } from "@/components/gift-reveal/unwrap";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type Gift = {
  id: string;
  status: string;
  openedAt: string | null;
  message: string;
  from: string;
  productName: string;
  productType: string;
  shipment: { status: string; carrier: string | null; trackingRef: string | null } | null;
};

export default function GiftDetail() {
  const params = useParams<{ id: string }>();
  const [gift, setGift] = useState<Gift | null>(null);
  const [showUnwrap, setShowUnwrap] = useState(false);
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void tgApi<Gift>(`/api/v1/gifts/${params.id}`).then((row) => {
      setGift(row);
      setShowUnwrap(!row.openedAt && row.status === "AWAITING_REDEMPTION");
    });
  }, [params.id]);

  async function opened() {
    await tgApi(`/api/v1/gifts/${params.id}/opened`, { method: "POST" });
    setShowUnwrap(false);
  }

  async function redeem(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const next = await tgApi<Gift>(`/api/v1/gifts/${params.id}/redeem`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey("redeem") },
        body: JSON.stringify(gift?.productType === "DIGITAL" ? {} : { line1, city, state, postalCode }),
      });
      setGift(next);
      toast.success(gift?.productType === "DIGITAL" ? "Your file is ready" : "Delivery address saved");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not redeem");
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    const file = await tgApi<{ url: string }>(`/api/v1/gifts/${params.id}/download`);
    window.location.assign(file.url);
  }

  if (!gift) {
    return (
      <TgPage className="flex min-h-[45dvh] items-center justify-center">
        <p className="text-sm opacity-70">Loading gift…</p>
      </TgPage>
    );
  }

  if (showUnwrap) {
    return <Unwrap from={gift.from} message={gift.message} product={gift.productName} onDone={() => void opened()} />;
  }

  return (
    <TgPage className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/tg/creator/gifts"
          className="glass-subtle inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-ink/85"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All gifts
        </Link>
        <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-gold">
          {gift.status.replaceAll("_", " ")}
        </span>
      </div>

      <TgCard className="space-y-3 p-5">
        <p className="text-xs uppercase tracking-wider opacity-60">From {gift.from}</p>
        <h1 className="font-serif text-3xl">{gift.productName}</h1>
        {gift.message && (
          <blockquote className="glass-subtle rounded-2xl p-3.5 text-sm italic text-ink/85">
            “{gift.message}”
          </blockquote>
        )}
      </TgCard>

      {gift.status === "AWAITING_REDEMPTION" && (
        <TgCard className="p-5">
          <h2 className="font-serif text-xl">
            {gift.productType === "DIGITAL" ? "Unlock digital download" : "Where should we ship this?"}
          </h2>
          <p className="mt-1 text-xs opacity-70">
            Your address is only used by Givora fulfilment and is never shared with the fan.
          </p>
          <form className="mt-4 space-y-3" onSubmit={redeem}>
            {gift.productType === "PHYSICAL" && (
              <>
                <Field label="Street address" value={line1} onChange={(event) => setLine1(event.target.value)} required />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City" value={city} onChange={(event) => setCity(event.target.value)} required />
                  <Field label="State" value={state} onChange={(event) => setState(event.target.value)} required />
                </div>
                <Field label="PIN code" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} required />
              </>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Saving…" : gift.productType === "DIGITAL" ? "Get the file" : "Redeem gift"}
            </Button>
          </form>
        </TgCard>
      )}

      {gift.productType === "DIGITAL" && gift.status === "FULFILLED" && (
        <Button type="button" className="w-full" onClick={() => void download()}>
          Download file
        </Button>
      )}

      {gift.shipment && (
        <TgCard className="flex items-center gap-3 p-4 text-sm">
          <Truck className="h-5 w-5 text-gold" />
          <div>
            <p className="font-medium">Shipment: {gift.shipment.status}</p>
            {gift.shipment.trackingRef && (
              <p className="text-xs opacity-75">
                {gift.shipment.carrier} · {gift.shipment.trackingRef}
              </p>
            )}
          </div>
        </TgCard>
      )}
    </TgPage>
  );
}
