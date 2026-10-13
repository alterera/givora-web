"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";
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
    <TgPage className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-gold">Sent</p>
        <h1 className="font-serif mt-2 text-3xl">Gifts you sent</h1>
      </div>
      <div className="space-y-3">
        {orders.length === 0 && <p className="text-sm opacity-70">You have not sent a gift yet.</p>}
        {orders.map((order) => (
          <Link key={order.id} href={`/tg/orders/${order.id}`} className="block">
            <TgCard>
              <p className="text-sm text-gold">{order.creator.displayName}</p>
              <p>{order.items.map((item) => item.productName).join(", ")}</p>
              <p className="mt-1 text-sm opacity-70">{order.status} · {formatInr(order.totalPaise)}</p>
            </TgCard>
          </Link>
        ))}
      </div>
    </TgPage>
  );
}
