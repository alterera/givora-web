"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Field } from "@/components/ui/field";

type AdminOrder = {
  id: string;
  orderNumber: string;
  status: string;
  carrier: string | null;
  trackingRef: string | null;
  gift: {
    publicRef: string;
    items: Array<{ productName: string }>;
    payments: Array<{ id: string; status: string }>;
    claim: { recipientName: string; address: { line1: string; city: string; postalCode: string } | null } | null;
  };
};

const nextStatus: Record<string, string> = {
  PLACED: "PROCESSING",
  PROCESSING: "SHIPPED",
  SHIPPED: "DELIVERED",
};

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => api<AdminOrder[]>("/api/v1/admin/orders"),
  });
  const orders = ordersQuery.data ?? [];
  const [carrier, setCarrier] = useState("India Post");
  const [tracking, setTracking] = useState("");

  function load() {
    return queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="font-serif text-4xl">Fulfilment</h1>
      {ordersQuery.error instanceof ApiError && <p className="mt-4 text-rose">{ordersQuery.error.message}</p>}
      <div className="mt-8 space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-3xl bg-white p-5">
            <p className="text-sm text-gold">{order.orderNumber}</p>
            <h2 className="text-xl">{order.gift.items.map((item) => item.productName).join(", ")}</h2>
            <p className="text-sm">
              {order.status}
              {order.gift.claim ? ` · ${order.gift.claim.recipientName}, ${order.gift.claim.address?.city}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {order.gift.payments
                .filter((payment) => payment.status === "PAID")
                .map((payment) => (
                  <button
                    key={payment.id}
                    type="button"
                    className="rounded-full border border-rose px-3 py-2 text-sm text-rose"
                    onClick={() =>
                      void api(`/api/v1/admin/payments/${payment.id}/refunds`, { method: "POST" }).then(() => {
                        toast.success("Refund started");
                        return load();
                      })
                    }
                  >
                    Refund
                  </button>
                ))}
              {nextStatus[order.status] && (
                <button
                  type="button"
                  className="rounded-full bg-ink px-3 py-2 text-sm text-paper"
                  onClick={() =>
                    void api(`/api/v1/admin/orders/${order.id}/status`, {
                      method: "PATCH",
                      body: JSON.stringify({ status: nextStatus[order.status] }),
                    }).then(load)
                  }
                >
                  Mark {nextStatus[order.status].toLowerCase()}
                </button>
              )}
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <Field label="Carrier" value={carrier} onChange={(event) => setCarrier(event.target.value)} />
              <Field label="Tracking" value={tracking} onChange={(event) => setTracking(event.target.value)} />
              <button
                type="button"
                className="self-end rounded-full border border-ink/15 px-3 py-3 text-sm"
                onClick={() =>
                  void api(`/api/v1/admin/orders/${order.id}/shipping`, {
                    method: "POST",
                    body: JSON.stringify({ carrier, trackingRef: tracking }),
                  }).then(load)
                }
              >
                Save shipping
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
