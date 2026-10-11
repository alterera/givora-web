"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { api } from "@/lib/api";
import type { GiftView } from "@/lib/types";

export default function SentPage() {
  const params = useParams<{ giftId: string }>();
  const [gift, setGift] = useState<GiftView | null>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    void confetti({ particleCount: 40, spread: 50, origin: { y: 0.3 } });
    void api<GiftView>(`/api/v1/gifts/${params.giftId}`).then(setGift);
    void api<{ url: string; message: string }>(`/api/v1/gifts/${params.giftId}/share`).then((share) => {
      setUrl(share.url);
      toast(share.message);
    });
  }, [params.giftId]);

  async function copy() {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }

  async function nativeShare() {
    if (navigator.share) await navigator.share({ title: "A gift for you", url });
    else await copy();
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-16 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-gold">Paid</p>
      <h1 className="font-serif mt-3 text-5xl">The link is ready</h1>
      <p className="mt-4 text-ink/70">Share it yourself. We also keep a copy on this page. Opening a new link replaces the old one.</p>
      {url && (
        <div className="mt-8 space-y-4">
          <QRCodeSVG value={url} className="mx-auto" />
          <p className="break-all text-sm">{url}</p>
          <div className="flex justify-center gap-2">
            <button type="button" className="rounded-full bg-ink px-4 py-2 text-paper" onClick={() => void copy()}>
              Copy
            </button>
            <a className="rounded-full border border-ink/15 px-4 py-2" href={`https://wa.me/?text=${encodeURIComponent(`A gift for you ${url}`)}`}>
              WhatsApp
            </a>
            <button type="button" className="rounded-full border border-ink/15 px-4 py-2" onClick={() => void nativeShare()}>
              Share
            </button>
          </div>
        </div>
      )}
      {gift && <p className="mt-6 text-sm">Reference {gift.publicRef}</p>}
    </div>
  );
}
