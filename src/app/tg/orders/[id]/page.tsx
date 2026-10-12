"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { tgApi } from "@/lib/tg-api";

type Order = {
  publicRef: string;
  status: string;
  creator: { displayName: string };
  items: Array<{ productName: string; status: string; gift: { status: string; shipment: { status: string; trackingRef: string | null } | null } | null }>;
};

export default function OrderDetail() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  useEffect(() => {
    void tgApi<Order>(`/api/v1/orders/${params.id}`).then(setOrder);
  }, [params.id]);
  if (!order) return <p className="p-6">Loading…</p>;
  return (
    <div className="px-5 py-8">
      <p className="text-sm text-gold">{order.publicRef}</p>
      <h1 className="font-serif text-4xl">Gift for {order.creator.displayName}</h1>
      <ul className="mt-6 space-y-3">
        {order.items.map((item) => (
          <li key={item.productName} className="rounded-2xl bg-white p-4">
            <p>{item.productName}</p>
            <p className="text-sm opacity-70">{item.gift?.status ?? item.status}</p>
            {item.gift?.shipment?.trackingRef && <p className="text-sm">Tracking {item.gift.shipment.trackingRef}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
