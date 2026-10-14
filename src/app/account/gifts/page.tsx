"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatInr } from "@/lib/money";

type Order = {
  id: string;
  publicRef: string;
  status: string;
  totalPaise: number;
  creator: { displayName: string };
  items: Array<{ productName: string; gift: { status: string } | null }>;
};

export default function AccountGiftsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    void api<Order[]>("/api/v1/orders").then(setOrders);
  }, []);
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-4xl">Gifts you sent</h1>
      <div className="mt-8 space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="glass-card rounded-3xl p-5">
            <p className="text-sm text-gold">{order.publicRef} · {order.creator.displayName}</p>
            <h2 className="text-xl">{order.items.map((item) => item.productName).join(", ")}</h2>
            <p className="text-sm opacity-70">{order.status} · {order.items.map((item) => item.gift?.status).filter(Boolean).join(", ")}</p>
            <p className="mt-2">{formatInr(order.totalPaise)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
