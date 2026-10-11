"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { GiftView } from "@/lib/types";
import { formatInr } from "@/lib/money";

export default function AccountGiftsPage() {
  const [gifts, setGifts] = useState<GiftView[]>([]);
  useEffect(() => {
    void api<GiftView[]>("/api/v1/gifts").then(setGifts);
  }, []);
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-4xl">Gifts you sent</h1>
      <div className="mt-8 space-y-4">
        {gifts.map((gift) => (
          <article key={gift.id} className="rounded-3xl bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gold">{gift.publicRef}</p>
                <h2 className="font-serif text-2xl">{gift.items[0]?.productName}</h2>
                <p className="text-sm text-ink/60">{gift.status.replaceAll("_", " ")}</p>
              </div>
              <p>{formatInr(gift.totalPaise)}</p>
            </div>
            <ol className="mt-4 space-y-1 text-sm text-ink/70">
              {gift.timeline.map((event) => (
                <li key={event.at}>
                  {event.type.toLowerCase()} · {new Date(event.at).toLocaleString("en-IN")}
                </li>
              ))}
              {gift.openedAt && <li>opened · {new Date(gift.openedAt).toLocaleString("en-IN")}</li>}
              {gift.claimedAt && <li>claimed · {new Date(gift.claimedAt).toLocaleString("en-IN")}</li>}
              {gift.fulfilment && (
                <li>
                  {gift.fulfilment.status.toLowerCase()}
                  {gift.fulfilment.trackingRef ? ` · ${gift.fulfilment.carrier} ${gift.fulfilment.trackingRef}` : ""}
                </li>
              )}
            </ol>
            <div className="mt-4 flex gap-3 text-sm">
              {gift.status === "READY_TO_SEND" && (
                <>
                  <Link href={`/gifts/sent/${gift.id}`} className="underline">
                    Share link
                  </Link>
                  <button
                    type="button"
                    className="underline"
                    onClick={() => void api(`/api/v1/gifts/${gift.id}/extend`, { method: "POST" }).then(() => location.reload())}
                  >
                    Extend once
                  </button>
                  <button
                    type="button"
                    className="underline text-rose"
                    onClick={() => void api(`/api/v1/gifts/${gift.id}/revoke`, { method: "POST" }).then(() => location.reload())}
                  >
                    Revoke
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
