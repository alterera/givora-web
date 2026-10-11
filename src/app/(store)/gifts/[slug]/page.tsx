import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi } from "@/lib/server-api";
import type { Product } from "@/lib/types";
import { formatInr } from "@/lib/money";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await publicApi<Product>(`/products/${slug}`);
  if (!product) notFound();
  const variant = product.variants[0];
  return (
    <article className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-2">
      <div className="min-h-80 rounded-[2rem] bg-gradient-to-br from-ink to-gold/80" />
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-gold">{product.occasion?.name}</p>
        <h1 className="font-serif mt-3 text-5xl">{product.name}</h1>
        <p className="mt-4 text-lg text-ink/75">{product.description}</p>
        <p className="mt-4 text-ink/60">{product.story}</p>
        <p className="mt-6 text-2xl">{variant ? formatInr(variant.pricePaise) : "Unavailable"}</p>
        {variant?.lowStock && <p className="mt-2 text-sm text-rose">Only a few left — a real count, not a trick.</p>}
        {product.giftedCount > 0 && <p className="mt-2 text-sm text-ink/50">Gifted {product.giftedCount} times</p>}
        {variant && variant.available > 0 ? (
          <Link
            href={`/checkout?variant=${variant.id}&name=${encodeURIComponent(product.name)}&price=${variant.pricePaise}`}
            className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-paper"
          >
            Gift this
          </Link>
        ) : (
          <p className="mt-8 text-rose">This one is waiting to be restocked.</p>
        )}
      </div>
    </article>
  );
}
