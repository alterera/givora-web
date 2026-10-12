"use client";

import { useEffect, useState } from "react";
import { tgApi } from "@/lib/tg-api";

type Gift = { id: string; status: string; productName: string; from: string };

export default function GiftInbox() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  useEffect(() => {
    void tgApi<Gift[]>("/api/v1/gifts/received").then(setGifts);
  }, []);
  const groups = ["AWAITING_REDEMPTION", "REDEEMED", "FULFILLED", "EXPIRED", "REFUNDED"];
  return (
    <div className="px-5 py-8">
      <h1 className="font-serif text-4xl">Gifts for you</h1>
      {groups.map((status) => (
        <section key={status} className="mt-6">
          <h2 className="text-sm uppercase tracking-widest text-gold">{status.replaceAll("_", " ")}</h2>
          {gifts.filter((gift) => gift.status === status).map((gift) => (
            <a key={gift.id} href={`/tg/creator/gifts/${gift.id}`} className="mt-2 block rounded-2xl bg-white p-4">
              {gift.productName}
              <span className="block text-sm opacity-70">From {gift.from}</span>
            </a>
          ))}
        </section>
      ))}
    </div>
  );
}
