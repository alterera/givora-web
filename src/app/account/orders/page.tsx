"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatInr } from "@/lib/money";

type Order = {
  id: string;
  publicRef: string;
  status: string;
  totalPaise: number;
  items: Array<{ productName: string; quantity: number }>;
  fulfilment: { orderNumber: string; status: string; carrier: string | null; trackingRef: string | null } | null;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    void api<Order[]>("/api/v1/orders").then(setOrders);
  }, []);
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-4xl">Orders</h1>
      <div className="mt-8 space-y-3">
        {orders.map((order) => (
          <article key={order.id} className="glass-card rounded-3xl p-5">
            <p className="text-sm text-gold">{order.publicRef}</p>
            <h2 className="text-xl">{order.items.map((item) => item.productName).join(", ")}</h2>
            <p className="text-sm text-ink/60">
              {order.status}
              {order.fulfilment ? ` · ${order.fulfilment.orderNumber} · ${order.fulfilment.status}` : ""}
            </p>
            <p className="mt-2">{formatInr(order.totalPaise)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
