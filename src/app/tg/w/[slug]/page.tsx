"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatInr } from "@/lib/money";
import { tgApi } from "@/lib/tg-api";

type Item = {
  variantId: string;
  productName: string;
  description: string;
  pricePaise: number;
  shippingPaise: number;
  type: string;
  imageUrl: string | null;
  available: number | null;
  lowStock: boolean;
  deliveryInfo: string | null;
  refundTerms: string | null;
};

type Wishlist = {
  displayName: string;
  bio: string;
  giftNote: string;
  avatarUrl: string | null;
  personaDisclosure: string | null;
  slug: string;
  id: string;
  items: Item[];
};

export default function WishlistPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [open, setOpen] = useState<Item | null>(null);

  useEffect(() => {
    void tgApi<Wishlist>(`/api/v1/creators/${params.slug}`).then(setWishlist).catch(() => toast.error("Wishlist unavailable"));
  }, [params.slug]);

  function giftThis(item: Item) {
    if (!wishlist || item.available === 0) return;
    router.push(`/tg/checkout?creator=${wishlist.id}&variant=${item.variantId}&slug=${wishlist.slug}`);
  }

  if (!wishlist) return <p className="p-6">Loading wishlist…</p>;
  return (
    <div className="px-5 py-8">
      <p className="text-sm uppercase tracking-[0.2em] text-gold">Wishlist of {wishlist.displayName}</p>
      <h1 className="font-serif mt-2 text-4xl">Send a gift. Make their day.</h1>
      <p className="mt-3 text-sm opacity-80">{wishlist.giftNote || wishlist.bio}</p>
      {wishlist.personaDisclosure && <p className="mt-2 text-xs opacity-60">{wishlist.personaDisclosure}</p>}
      <div className="mt-6 space-y-3">
        {wishlist.items.map((item) => (
          <button key={item.variantId} type="button" className="w-full rounded-3xl bg-white p-4 text-left" onClick={() => setOpen(item)}>
            <p className="text-xs uppercase tracking-widest text-gold">{item.type === "DIGITAL" ? "Digital" : "Physical"}</p>
            <h2 className="font-serif text-2xl">{item.productName}</h2>
            <p className="mt-1">{formatInr(item.pricePaise)}</p>
            {item.lowStock && <p className="text-xs text-rose">Only a few left</p>}
            {item.available === 0 && <p className="text-xs text-rose">Unavailable</p>}
          </button>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-40 bg-ink/40 p-4" onClick={() => setOpen(null)}>
          <div className="mt-16 rounded-3xl bg-paper p-5" onClick={(event) => event.stopPropagation()}>
            <h2 className="font-serif text-3xl">{open.productName}</h2>
            <p className="mt-2 text-sm">{open.description}</p>
            <p className="mt-3">{formatInr(open.pricePaise)} {open.shippingPaise ? `+ ${formatInr(open.shippingPaise)} shipping` : "· shipping free"}</p>
            <p className="mt-2 text-xs opacity-70">{open.deliveryInfo}</p>
            <p className="mt-2 text-xs opacity-70">{open.refundTerms}</p>
            <button type="button" className="mt-4 rounded-full bg-ink px-5 py-3 text-paper" disabled={open.available === 0} onClick={() => giftThis(open)}>
              Gift this
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
