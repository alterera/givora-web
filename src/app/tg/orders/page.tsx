"use client";

import { useEffect, useState } from "react";
import { formatInr } from "@/lib/money";
import { tgApi } from "@/lib/tg-api";

type Order = {
  id: string;
  publicRef: string;
  status: string;
  totalPaise: number;
  creator: { displayName: string };
  items: Array<{ productName: string; gift: { status: string } | null }>;
};

export default function SentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    void tgApi<Order[]>("/api/v1/orders").then(setOrders);
  }, []);
  return (
    <div className="px-5 py-8">
      <h1 className="font-serif text-4xl">Gifts you sent</h1>
      <div className="mt-6 space-y-3">
        {orders.map((order) => (
          <a key={order.id} href={`/tg/orders/${order.id}`} className="block rounded-3xl bg-white p-4">
            <p className="text-sm text-gold">{order.creator.displayName}</p>
            <p>{order.items.map((item) => item.productName).join(", ")}</p>
            <p className="text-sm opacity-70">{order.status} · {formatInr(order.totalPaise)}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
