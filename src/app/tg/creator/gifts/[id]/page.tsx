"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError, idempotencyKey } from "@/lib/api";
import { tgApi } from "@/lib/tg-api";
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
    try {
      const next = await tgApi<Gift>(`/api/v1/gifts/${params.id}/redeem`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey("redeem") },
        body: JSON.stringify(gift?.productType === "DIGITAL" ? {} : { line1, city, state, postalCode }),
      });
      setGift(next);
      toast.success(gift?.productType === "DIGITAL" ? "Your file is ready" : "Address saved");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not redeem");
    }
  }

  async function download() {
    const file = await tgApi<{ url: string }>(`/api/v1/gifts/${params.id}/download`);
    window.location.assign(file.url);
  }

  if (!gift) return <p className="p-6">Loading…</p>;
  if (showUnwrap) return <Unwrap from={gift.from} message={gift.message} product={gift.productName} onDone={() => void opened()} />;
  return (
    <div className="px-5 py-8">
      <p className="text-sm text-gold">{gift.status.replaceAll("_", " ")}</p>
      <h1 className="font-serif text-4xl">{gift.productName}</h1>
      <p className="mt-2">From {gift.from}</p>
      {gift.message && <p className="mt-4 italic">“{gift.message}”</p>}
      {gift.status === "AWAITING_REDEMPTION" && (
        <form className="mt-6 space-y-3" onSubmit={redeem}>
          {gift.productType === "PHYSICAL" && (
            <>
              <Field label="Address" value={line1} onChange={(event) => setLine1(event.target.value)} required />
              <Field label="City" value={city} onChange={(event) => setCity(event.target.value)} required />
              <Field label="State" value={state} onChange={(event) => setState(event.target.value)} required />
              <Field label="PIN" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} required />
            </>
          )}
          <Button type="submit">{gift.productType === "DIGITAL" ? "Get the file" : "Redeem gift"}</Button>
        </form>
      )}
      {gift.productType === "DIGITAL" && gift.status === "FULFILLED" && (
        <Button type="button" className="mt-6" onClick={() => void download()}>
          Download
        </Button>
      )}
      {gift.shipment && (
        <p className="mt-4 text-sm">
          {gift.shipment.status}
          {gift.shipment.trackingRef ? ` · ${gift.shipment.carrier} ${gift.shipment.trackingRef}` : ""}
        </p>
      )}
    </div>
  );
}
