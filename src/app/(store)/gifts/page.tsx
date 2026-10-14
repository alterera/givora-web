import Link from "next/link";
import { publicApi } from "@/lib/server-api";
import type { Catalogue } from "@/lib/types";
import { formatInr } from "@/lib/money";

export const metadata = { title: "Gifts" };

export default async function GiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ occasion?: string; category?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.occasion) query.set("occasion", params.occasion);
  if (params.category) query.set("category", params.category);
  const catalogue = await publicApi<Catalogue>(`/products?${query.toString()}`);
  const occasions = await publicApi<Array<{ slug: string; name: string }>>("/occasions");
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="font-serif text-5xl">Choose what to give</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/gifts" className="rounded-full border border-ink/10 px-4 py-2 text-sm">
          All
        </Link>
        {(occasions ?? []).map((occasion) => (
          <Link
            key={occasion.slug}
            href={`/gifts?occasion=${occasion.slug}`}
            className="rounded-full border border-ink/10 px-4 py-2 text-sm"
          >
            {occasion.name}
          </Link>
        ))}
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {(catalogue?.items ?? []).map((product) => (
          <Link key={product.id} href={`/gifts/${product.slug}`} className="glass-card rounded-[1.5rem] p-5">
            <div className="mb-4 h-36 rounded-2xl bg-gradient-to-br from-gold/30 to-rose/20" />
            <h2 className="font-serif text-2xl">{product.name}</h2>
            <p className="mt-2 text-sm text-ink/70">{product.story}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>{formatInr(product.variants[0]?.pricePaise ?? 0)}</span>
              {product.variants[0]?.lowStock && <span className="text-rose">Only a few left</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
