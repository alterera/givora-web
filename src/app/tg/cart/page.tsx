"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { formatInr } from "@/lib/money";

type Item = { variantId: string; productName: string; pricePaise: number; shippingPaise: number; quantity?: number };
type Cart = { creatorId: string; slug: string; name: string; items: Item[] };

function readCart() {
  const raw = localStorage.getItem("givora-cart");
  return raw ?? "";
}

export default function CartPage() {
  const raw = useSyncExternalStore(() => () => undefined, readCart, () => "");
  const cart = raw ? (JSON.parse(raw) as Cart) : null;
  if (!cart?.items.length) return <p className="p-6">Your gift cart is empty.</p>;
  const goods = cart.items.reduce((sum, item) => sum + item.pricePaise, 0);
  const shipping = cart.items.reduce((sum, item) => sum + item.shippingPaise, 0);
  return (
    <div className="px-5 py-8">
      <p className="text-sm text-gold">Gift for {cart.name}</p>
      <h1 className="font-serif text-4xl">Your cart</h1>
      <ul className="mt-6 space-y-3">
        {cart.items.map((item, index) => (
          <li key={`${item.variantId}-${index}`} className="rounded-2xl bg-white p-4">
            {item.productName}
            <span className="float-right">{formatInr(item.pricePaise + item.shippingPaise)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm">Goods {formatInr(goods)} · Shipping {formatInr(shipping)}</p>
      <p className="text-xl">{formatInr(goods + shipping)}</p>
      <Link className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-paper" href="/tg/checkout">
        Continue
      </Link>
    </div>
  );
}
