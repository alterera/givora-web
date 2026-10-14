"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { formatInr } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Field, TextArea } from "@/components/ui/field";

type WishlistItem = { wishlistItemId: string; productName: string; pricePaise: number };
type Profile = { displayName: string; slug: string; shortCode: string; status?: string; items: WishlistItem[] };
type Catalogue = { items: Array<{ name: string; variants: Array<{ id: string; pricePaise: number }> }> };

export default function InfluencerWishlist() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [missing, setMissing] = useState(false);
  const [catalogue, setCatalogue] = useState<Catalogue["items"]>([]);
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");

  function load() {
    return api<Profile>("/api/v1/creators/me")
      .then((row) => {
        setProfile(row);
        setMissing(false);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) setMissing(true);
        else toast.error(error instanceof ApiError ? error.message : "Sign in to manage your wishlist");
      });
  }

  useEffect(() => {
    void load();
    void api<Catalogue>("/api/v1/products?pageSize=50")
      .then((body) => setCatalogue(body.items ?? []))
      .catch(() => undefined);
  }, []);

  async function apply(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api("/api/v1/creators/me", {
        method: "POST",
        body: JSON.stringify({ displayName, slug, bio }),
      });
      toast.success("Sent for admin approval");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not apply");
    }
  }

  if (missing) {
    return (
      <form className="mx-auto max-w-lg space-y-4 px-5 py-12" onSubmit={(event) => void apply(event)}>
        <h1 className="font-serif text-4xl">Your wishlist</h1>
        <p className="text-ink/70">Add a public name. An admin approves it before fans can see the list.</p>
        <Field label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
        <Field label="Public name" value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} required />
        <TextArea label="Bio" value={bio} onChange={(event) => setBio(event.target.value)} />
        <Button type="submit">Submit for approval</Button>
      </form>
    );
  }

  if (!profile) return <p className="px-5 py-12">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-sm uppercase tracking-[0.2em] text-gold">{profile.status}</p>
      <h1 className="font-serif text-4xl">{profile.displayName}</h1>
      {profile.status !== "APPROVED" && (
        <p className="mt-3 text-ink/70">Your wishlist stays private until an admin approves it.</p>
      )}
      <p className="mt-4 text-sm">Web: {typeof window === "undefined" ? "" : window.location.origin}/{profile.slug}</p>
      <p className="mt-1 break-all text-sm">
        Telegram: https://t.me/{process.env.NEXT_PUBLIC_TELEGRAM_BOT ?? "GivoraWorldBot"}?startapp={profile.shortCode}
      </p>
      <button
        type="button"
        className="mt-3 rounded-full bg-ink px-4 py-2 text-sm text-paper"
        onClick={() =>
          void navigator.clipboard
            .writeText(`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT ?? "GivoraWorldBot"}?startapp=${profile.shortCode}`)
            .then(() => toast.success("Telegram link copied"))
        }
      >
        Copy Telegram link
      </button>
      <a className="ml-3 text-sm underline" href={`/${profile.slug}`}>
        Preview wishlist
      </a>
      <h2 className="mt-8 text-xl">On your list</h2>
      <ul className="mt-3 space-y-2">
        {profile.items.map((item) => (
          <li key={item.wishlistItemId} className="glass-card flex items-center justify-between rounded-2xl p-4">
            <span>
              {item.productName} · {formatInr(item.pricePaise)}
            </span>
            <button
              type="button"
              className="text-rose"
              onClick={() =>
                void api(`/api/v1/creators/me/wishlist/${item.wishlistItemId}`, { method: "DELETE" })
                  .then(load)
                  .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not remove"))
              }
            >
              Remove
            </button>
          </li>
        ))}
        {profile.items.length === 0 && <li className="text-ink/60">Nothing here yet. Add a product an admin has listed.</li>}
      </ul>
      <h2 className="mt-10 text-xl">Catalogue</h2>
      <ul className="mt-3 space-y-2">
        {catalogue.map((product) => (
          <li key={product.name} className="glass-card flex items-center justify-between rounded-2xl p-4">
            <span>
              {product.name} · {formatInr(product.variants[0]?.pricePaise ?? 0)}
            </span>
            {product.variants[0] && (
              <button
                type="button"
                className="underline"
                onClick={() =>
                  void api("/api/v1/creators/me/wishlist", {
                    method: "POST",
                    body: JSON.stringify({ variantId: product.variants[0].id }),
                  })
                    .then(load)
                    .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not add"))
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
