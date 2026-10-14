"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { TgCard, TgPage } from "@/features/telegram/tg-shell";
import { formatInr } from "@/lib/money";
import { tgApi } from "@/lib/tg-api";

type Order = {
  publicRef: string;
  status: string;
  totalPaise: number;
  creator: { displayName: string; slug: string };
  items: Array<{
    productName: string;
    status: string;
    gift: {
      status: string;
      shipment: { status: string; carrier: string | null; trackingRef: string | null } | null;
    } | null;
  }>;
};

export default function OrderDetail() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    void tgApi<Order>(`/api/v1/orders/${params.id}`).then(setOrder);
  }, [params.id]);

  if (!order) {
    return (
      <TgPage className="flex min-h-[40dvh] items-center justify-center">
        <p className="text-sm opacity-70">Loading gift details…</p>
      </TgPage>
    );
  }

  return (
    <TgPage className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/tg/orders"
          className="glass-subtle inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-ink/85"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Sent gifts
        </Link>
        <span className="font-mono text-xs text-gold">{order.publicRef}</span>
      </div>

      <div>
        <h1 className="font-serif text-3xl">Gift for {order.creator.displayName}</h1>
        <p className="mt-1 text-sm opacity-75">
          Order status: <span className="font-medium">{order.status.replaceAll("_", " ")}</span> · {formatInr(order.totalPaise)}
        </p>
      </div>

      <div className="space-y-3">
        {order.items.map((item) => (
          <TgCard key={item.productName} className="space-y-2 p-5">
            <div className="flex items-center justify-between">
              <p className="font-serif text-xl">{item.productName}</p>
              <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-gold">
                {(item.gift?.status ?? item.status).replaceAll("_", " ")}
              </span>
            </div>
            {item.gift?.shipment && (
              <div className="flex items-center gap-2 pt-2 text-xs opacity-80">
                <PackageCheck className="h-4 w-4 text-gold" />
                <span>
                  Shipment: {item.gift.shipment.status}
                  {item.gift.shipment.trackingRef ? ` · ${item.gift.shipment.carrier ?? ""} ${item.gift.shipment.trackingRef}` : ""}
                </span>
              </div>
            )}
          </TgCard>
        ))}
      </div>
    </TgPage>
  );
}
