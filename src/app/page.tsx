import Link from "next/link";
import { publicApi } from "@/lib/server-api";

type CreatorCard = {
  slug: string;
  displayName: string;
  bio: string;
  giftNote: string;
  avatarUrl: string | null;
  itemCount: number;
};

export default async function HomePage() {
  const creators = await publicApi<CreatorCard[]>("/creators");
  return (
    <div>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.2fr_0.8fr] md:py-24">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-gold">GivoraWorld</p>
          <h1 className="font-serif mt-4 text-5xl leading-tight md:text-7xl">Send a gift to the creator you follow.</h1>
          <p className="mt-6 max-w-xl text-lg text-ink/75">
            Open their wishlist, pay for what they chose, and we deliver it. They never share an address with you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/creators" className="rounded-full bg-ink px-6 py-3 text-paper">
              Browse creators
            </Link>
            <Link href="/account/wishlist" className="rounded-full border border-ink/15 px-6 py-3">
              I am a creator
            </Link>
          </div>
        </div>
        <div className="glass-card rounded-[2rem] p-8 text-ink">
          <p className="text-sm text-gold">How it works</p>
          <ol className="mt-6 space-y-4 text-lg">
            <li>1. The creator shares a wishlist link.</li>
            <li>2. You pay for one gift from their list.</li>
            <li>3. They redeem it privately. We ship it.</li>
          </ol>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <h2 className="font-serif text-3xl">Wishlists</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {(creators ?? []).map((creator) => (
            <Link key={creator.slug} href={`/${creator.slug}`} className="glass-card rounded-[1.5rem] p-5 transition hover:opacity-95">
              <p className="text-xs uppercase tracking-widest text-gold">{creator.itemCount} gifts</p>
              <h3 className="font-serif mt-3 text-2xl">{creator.displayName}</h3>
              <p className="mt-2 text-sm text-ink/70">{creator.giftNote || creator.bio}</p>
            </Link>
          ))}
          {!creators?.length && <p className="text-ink/60">Approved creator wishlists will appear here.</p>}
        </div>
      </section>
    </div>
  );
}
