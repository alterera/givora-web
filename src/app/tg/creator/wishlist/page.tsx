"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatInr } from "@/lib/money";
import { tgApi } from "@/lib/tg-api";

type CatalogueItem = { name: string; variants: Array<{ id: string; pricePaise: number }> };
type Mine = { items: Array<{ wishlistItemId: string; productName: string; variantId: string }> };

export default function ManageWishlist() {
  const [mine, setMine] = useState<Mine | null>(null);
  const [catalogue, setCatalogue] = useState<CatalogueItem[]>([]);

  function load() {
    return tgApi<Mine>("/api/v1/creators/me").then(setMine);
  }
  useEffect(() => {
    void load();
    void fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1/products`)
      .then((response) => response.json())
      .then((body: { items: CatalogueItem[] }) => setCatalogue(body.items ?? []))
      .catch(() => undefined);
  }, []);

  return (
    <div className="px-5 py-8">
      <h1 className="font-serif text-4xl">Wishlist</h1>
      <ul className="mt-4 space-y-2">
        {(mine?.items ?? []).map((item) => (
          <li key={item.wishlistItemId} className="flex justify-between rounded-2xl bg-white p-3">
            {item.productName}
            <button
              type="button"
              className="text-rose"
              onClick={() => void tgApi(`/api/v1/creators/me/wishlist/${item.wishlistItemId}`, { method: "DELETE" }).then(load)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <h2 className="mt-8 text-xl">Catalogue</h2>
      <ul className="mt-3 space-y-2">
        {catalogue.map((product) => (
          <li key={product.name} className="rounded-2xl bg-white p-3">
            {product.name} · {formatInr(product.variants[0]?.pricePaise ?? 0)}
            {product.variants[0] && (
              <button
                type="button"
                className="ml-3 underline"
                onClick={() =>
                  void tgApi("/api/v1/creators/me/wishlist", {
                    method: "POST",
                    body: JSON.stringify({ variantId: product.variants[0].id }),
                  })
                    .then(load)
                    .catch(() => toast.error("Could not add"))
                }
              >
                Add
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
