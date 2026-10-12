import Link from "next/link";
import { publicApi } from "@/lib/server-api";

type CreatorCard = {
  slug: string;
  displayName: string;
  bio: string;
  giftNote: string;
  itemCount: number;
};

export const metadata = { title: "Creators" };

export default async function CreatorsPage() {
  const creators = await publicApi<CreatorCard[]>("/creators");
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="font-serif text-5xl">Creators</h1>
      <p className="mt-3 max-w-xl text-ink/70">Each wishlist is the only place a fan can buy a gift for that creator.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {(creators ?? []).map((creator) => (
          <Link key={creator.slug} href={`/${creator.slug}`} className="rounded-[1.5rem] bg-white p-5">
            <p className="text-xs uppercase tracking-widest text-gold">{creator.itemCount} on the list</p>
            <h2 className="font-serif mt-3 text-2xl">{creator.displayName}</h2>
            <p className="mt-2 text-sm text-ink/70">{creator.bio}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
