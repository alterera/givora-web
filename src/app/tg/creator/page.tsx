"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { tgApi } from "@/lib/tg-api";

type Profile = { slug: string; shortCode: string; displayName: string; status?: string };

export default function CreatorHome() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    void tgApi<Profile>("/api/v1/creators/me")
      .then(setProfile)
      .catch(() => setMissing(true));
  }, []);
  if (missing) {
    return (
      <div className="px-5 py-8">
        <h1 className="font-serif text-4xl">Become a creator</h1>
        <Link className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-paper" href="/tg/creator/apply">
          Apply
        </Link>
      </div>
    );
  }
  if (!profile) return <p className="p-6">Loading…</p>;
  const web = typeof window === "undefined" ? "" : window.location.origin;
  const link = `${web}/${profile.slug}`;
  const telegram = `https://t.me/GivoraWorldBot?startapp=${profile.shortCode}`;
  return (
    <div className="px-5 py-8">
      <p className="text-sm uppercase tracking-[0.2em] text-gold">{profile.status}</p>
      <h1 className="font-serif text-4xl">{profile.displayName}</h1>
      {profile.status !== "APPROVED" && <p className="mt-3">Your wishlist stays private until an admin approves it.</p>}
      <p className="mt-4 break-all text-sm">{link}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="rounded-full bg-ink px-4 py-2 text-paper" onClick={() => void navigator.clipboard.writeText(telegram).then(() => toast.success("Telegram link copied"))}>
          Copy Telegram link
        </button>
        <a className="rounded-full border border-ink/15 px-4 py-2" href={`https://t.me/share/url?url=${encodeURIComponent(telegram)}`}>
          Share
        </a>
        <Link className="rounded-full border border-ink/15 px-4 py-2" href={`/tg/w/${profile.slug}`}>
          Preview
        </Link>
      </div>
      <div className="mt-8 flex flex-col gap-3">
        <Link href="/tg/creator/wishlist">Manage wishlist</Link>
        <Link href="/tg/creator/gifts">Gifts received</Link>
      </div>
    </div>
  );
}
