import Link from "next/link";
import { publicApi } from "@/lib/server-api";
import type { Catalogue } from "@/lib/types";
import { formatInr } from "@/lib/money";

export default async function HomePage() {
  const catalogue = await publicApi<Catalogue>("/products?pageSize=3");
  return (
    <div>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.2fr_0.8fr] md:py-24">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-gold">A gift, then a moment</p>
          <h1 className="font-serif mt-4 text-5xl leading-tight md:text-7xl">Send the feeling before the parcel.</h1>
          <p className="mt-6 max-w-xl text-lg text-ink/75">
            Pick something thoughtful, write a note, and share a private link. They open it like a gift. The address comes after.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/gifts" className="rounded-full bg-ink px-6 py-3 text-paper">
              Find a gift
            </Link>
            <Link href="/gifts" className="rounded-full border border-ink/15 px-6 py-3">
              See occasions
            </Link>
          </div>
        </div>
        <div className="relative min-h-80 rounded-[2rem] bg-ink p-8 text-paper">
          <p className="text-sm text-paper/60">Preview</p>
          <p className="font-serif mt-10 text-4xl">“Thank you for inspiring me.”</p>
          <p className="mt-6 text-paper/70">A fan · cinematic reveal</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-20 md:grid-cols-3">
        {(catalogue?.items ?? []).map((product) => (
          <Link key={product.id} href={`/gifts/${product.slug}`} className="rounded-[1.5rem] border border-ink/10 bg-white p-5">
            <p className="text-xs uppercase tracking-widest text-gold">{product.occasion?.name}</p>
            <h2 className="font-serif mt-3 text-2xl">{product.name}</h2>
            <p className="mt-2 text-sm text-ink/70">{product.description}</p>
            <p className="mt-4">{formatInr(product.variants[0]?.pricePaise ?? 0)}</p>
            {product.giftedCount > 0 && (
              <p className="mt-2 text-xs text-ink/50">Gifted {product.giftedCount} times</p>
            )}
          </Link>
        ))}
        {!catalogue && <p className="text-ink/60">The catalogue will appear once the API is running.</p>}
      </section>
    </div>
  );
}
