import Link from "next/link";
import { notFound } from "next/navigation";
import { formatInr } from "@/lib/money";
import { publicApi } from "@/lib/server-api";

type Wishlist = {
  id: string;
  slug: string;
  shortCode: string;
  displayName: string;
  bio: string;
  giftNote: string;
  personaDisclosure: string | null;
  items: Array<{
    variantId: string;
    productName: string;
    pricePaise: number;
    shippingPaise: number;
    type: string;
    available: number | null;
    description: string;
  }>;
};

const reserved = new Set(["tg", "admin", "login", "register", "checkout", "gifts", "account", "legal", "orders", "g"]);

export default async function PublicWishlist({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (reserved.has(slug)) notFound();
  const wishlist = await publicApi<Wishlist>(`/creators/${slug}`);
  if (!wishlist) notFound();
  const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT ?? "GivoraWorldBot";
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-sm uppercase tracking-[0.2em] text-gold">{wishlist.displayName}</p>
      <h1 className="font-serif mt-2 text-5xl">{wishlist.giftNote || "Send a gift."}</h1>
      <p className="mt-4 text-ink/70">{wishlist.bio}</p>
      {wishlist.personaDisclosure && <p className="mt-2 text-sm text-ink/50">{wishlist.personaDisclosure}</p>}
      <a className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-paper" href={`https://t.me/${bot}?startapp=${wishlist.shortCode}`}>
        Open in Telegram
      </a>
      <div className="mt-8 space-y-3">
        {wishlist.items.map((item) => (
          <article key={item.variantId} className="rounded-3xl bg-white p-5">
            <p className="text-xs uppercase tracking-widest text-gold">{item.type === "DIGITAL" ? "Digital" : "Ships to them"}</p>
            <h2 className="font-serif text-2xl">{item.productName}</h2>
            <p className="mt-2 text-sm text-ink/70">{item.description}</p>
            <p className="mt-3">{formatInr(item.pricePaise)}{item.shippingPaise ? ` + ${formatInr(item.shippingPaise)} shipping` : ""}</p>
            {item.available === 0 ? (
              <p className="mt-2 text-rose">Unavailable</p>
            ) : (
              <Link className="mt-3 inline-flex underline" href={`/checkout?creator=${wishlist.id}&variant=${item.variantId}&name=${encodeURIComponent(item.productName)}&price=${item.pricePaise}`}>
                Gift this on the web
              </Link>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
