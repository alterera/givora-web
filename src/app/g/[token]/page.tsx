import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RevealStage } from "@/components/gift-reveal/reveal-stage";
import { apiBase } from "@/lib/utils";
import type { RevealGift } from "@/lib/types";

export const metadata: Metadata = {
  title: "You have received a gift",
  robots: { index: false, follow: false },
  openGraph: { title: "You have received a gift", description: "Open it on Givora." },
};

export default async function RevealPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const response = await fetch(`${apiBase()}/api/v1/public/gifts/${token}`, { cache: "no-store" });
  if (!response.ok) notFound();
  const gift = (await response.json()) as RevealGift;
  return <RevealStage token={token} gift={gift} />;
}
