"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Field } from "@/components/ui/field";

type Shipment = {
  id: string;
  status: string;
  gift: {
    orderItem: { productName: string; orderId: string };
    redemption: { line1: string; city: string; postalCode: string } | null;
  };
};

export default function AdminShipments() {
  const [rows, setRows] = useState<Shipment[]>([]);
  const [carrier, setCarrier] = useState("India Post");
  const [tracking, setTracking] = useState("");
  function load() {
    return api<Shipment[]>("/api/v1/admin/shipments").then(setRows);
  }
  useEffect(() => {
    void load().catch((error) => toast.error(error instanceof ApiError ? error.message : "Admin only"));
  }, []);
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-4xl">Shipments</h1>
      <div className="mt-6 space-y-4">
        {rows.map((row) => (
          <article key={row.id} className="rounded-3xl bg-white p-4">
            <p>{row.gift.orderItem.productName}</p>
            <p className="text-sm">{row.status}</p>
            {row.gift.redemption && (
              <p className="text-sm opacity-70">{row.gift.redemption.line1}, {row.gift.redemption.city} {row.gift.redemption.postalCode}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {row.status === "PENDING" && (
                <button type="button" className="rounded-full bg-ink px-3 py-2 text-sm text-paper" onClick={() => void api(`/api/v1/admin/shipments/${row.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "PACKED" }) }).then(load)}>
                  Packed
                </button>
              )}
              {row.status === "PACKED" && (
                <button type="button" className="rounded-full bg-ink px-3 py-2 text-sm text-paper" onClick={() => void api(`/api/v1/admin/shipments/${row.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "SHIPPED" }) }).then(load)}>
                  Shipped
                </button>
              )}
              {row.status === "SHIPPED" && (
                <button type="button" className="rounded-full bg-ink px-3 py-2 text-sm text-paper" onClick={() => void api(`/api/v1/admin/shipments/${row.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "DELIVERED" }) }).then(load)}>
                  Delivered
                </button>
              )}
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <Field label="Carrier" value={carrier} onChange={(event) => setCarrier(event.target.value)} />
              <Field label="Tracking" value={tracking} onChange={(event) => setTracking(event.target.value)} />
              <button type="button" className="self-end rounded-full border px-3 py-3 text-sm" onClick={() => void api(`/api/v1/admin/shipments/${row.id}/tracking`, { method: "POST", body: JSON.stringify({ carrier, trackingRef: tracking }) }).then(load)}>
                Save tracking
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
