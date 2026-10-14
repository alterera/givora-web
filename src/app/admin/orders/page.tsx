"use client";

import { useEffect, useState } from "react";
import { MapPin, Package, Truck } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Field } from "@/components/ui/field";

type Shipment = {
  id: string;
  status: "PENDING" | "PACKED" | "SHIPPED" | "DELIVERED" | "FAILED" | "RETURNED";
  carrier: string | null;
  trackingRef: string | null;
  gift: {
    orderItem: { productName: string; orderId: string };
    recipient?: { displayName: string | null; phone: string | null };
    redemption: { line1: string; line2?: string; city: string; state?: string; postalCode: string } | null;
  };
};

export default function AdminShipments() {
  const [rows, setRows] = useState<Shipment[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { carrier: string; tracking: string }>>({});

  function load() {
    return api<Shipment[]>("/api/v1/admin/shipments").then((list) => {
      setRows(list);
      setDrafts((prev) => {
        const next = { ...prev };
        for (const row of list) {
          if (!next[row.id]) {
            next[row.id] = {
              carrier: row.carrier ?? "India Post",
              tracking: row.trackingRef ?? "",
            };
          }
        }
        return next;
      });
    });
  }

  useEffect(() => {
    void load().catch((error) => toast.error(error instanceof ApiError ? error.message : "Admin only"));
  }, []);

  async function transition(id: string, status: string) {
    try {
      await api(`/api/v1/admin/shipments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(`Marked ${status}`);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update status");
    }
  }

  async function saveTracking(id: string) {
    const draft = drafts[id];
    if (!draft?.tracking.trim()) {
      toast.error("Enter a tracking number first");
      return;
    }
    try {
      await api(`/api/v1/admin/shipments/${id}/tracking`, {
        method: "POST",
        body: JSON.stringify({ carrier: draft.carrier, trackingRef: draft.tracking.trim() }),
      });
      toast.success("Tracking saved");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save tracking");
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
          <Truck className="h-4 w-4" /> Fulfilment Queue
        </div>
        <h1 className="font-serif mt-1 text-2xl">Redeemed Gifts & Shipments ({rows.length})</h1>
        <p className="mt-1 text-xs text-ink/75">
          When a creator redeems a physical gift, their private shipping address appears here for dispatch.
        </p>

        <div className="mt-6 space-y-4">
          {rows.length === 0 ? (
            <p className="glass-subtle rounded-2xl p-6 text-center text-sm text-ink/70">
              No shipments waiting for fulfilment yet.
            </p>
          ) : (
            rows.map((row) => {
              const draft = drafts[row.id] ?? { carrier: "India Post", tracking: "" };
              return (
                <article key={row.id} className="glass-subtle space-y-4 rounded-2xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gold" />
                        <h2 className="font-serif text-xl">{row.gift.orderItem.productName}</h2>
                        <span className="rounded-full bg-gold/15 px-3 py-0.5 text-xs font-semibold text-gold">
                          {row.status}
                        </span>
                      </div>
                      {row.gift.recipient?.displayName && (
                        <p className="mt-1 text-xs text-ink/70">Recipient: {row.gift.recipient.displayName}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {row.status === "PENDING" && (
                        <button
                          type="button"
                          className="rounded-full bg-ink px-4 py-2 text-xs font-medium text-paper"
                          onClick={() => void transition(row.id, "PACKED")}
                        >
                          Mark Packed
                        </button>
                      )}
                      {row.status === "PACKED" && (
                        <button
                          type="button"
                          className="rounded-full bg-ink px-4 py-2 text-xs font-medium text-paper"
                          onClick={() => void transition(row.id, "SHIPPED")}
                        >
                          Mark Shipped
                        </button>
                      )}
                      {row.status === "SHIPPED" && (
                        <button
                          type="button"
                          className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-medium text-white"
                          onClick={() => void transition(row.id, "DELIVERED")}
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>

                  {row.gift.redemption && (
                    <div className="glass-subtle flex items-start gap-2 rounded-2xl p-3.5 text-xs">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      <div>
                        <p className="font-medium text-ink">Private Delivery Address</p>
                        <p className="text-ink/80">
                          {row.gift.redemption.line1}, {row.gift.redemption.city}
                          {row.gift.redemption.state ? `, ${row.gift.redemption.state}` : ""} —{" "}
                          <span className="font-mono">{row.gift.redemption.postalCode}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field
                      label="Courier / Carrier"
                      value={draft.carrier}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [row.id]: { ...draft, carrier: event.target.value },
                        }))
                      }
                    />
                    <Field
                      label="Tracking reference / AWB"
                      placeholder="e.g. EW123456789IN"
                      value={draft.tracking}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [row.id]: { ...draft, tracking: event.target.value },
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="glass-subtle self-end rounded-full px-4 py-3 text-xs font-medium hover:opacity-90"
                      onClick={() => void saveTracking(row.id)}
                    >
                      Save tracking
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
