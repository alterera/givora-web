"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTelegramSession } from "@/features/telegram/session";
import { tgApi } from "@/lib/tg-api";

const fanItems = [
  { href: "/tg", label: "Home", match: (path: string) => path === "/tg" },
  { href: "/tg/orders", label: "Sent", match: (path: string) => path.startsWith("/tg/orders") },
  { href: "/tg/profile", label: "Profile", match: (path: string) => path.startsWith("/tg/profile") },
];

const creatorItems = [
  { href: "/tg/creator", label: "Studio", match: (path: string) => path === "/tg/creator" },
  { href: "/tg/creator/wishlist", label: "Wishlist", match: (path: string) => path.startsWith("/tg/creator/wishlist") },
  { href: "/tg/creator/gifts", label: "Gifts", match: (path: string) => path.startsWith("/tg/creator/gifts") },
  { href: "/tg/profile", label: "Profile", match: (path: string) => path.startsWith("/tg/profile") },
];

export function BottomDeck() {
  const { status } = useTelegramSession();
  const path = usePathname();
  const [creator, setCreator] = useState(false);

  useEffect(() => {
    if (status !== "ready") return;
    void tgApi<{ slug: string }>("/api/v1/creators/me")
      .then(() => setCreator(true))
      .catch(() => setCreator(false));
  }, [status]);

  if (status !== "ready") return null;
  if (path.startsWith("/tg/checkout") || path.startsWith("/tg/return") || path.startsWith("/pay/")) return null;

  const items = creator ? creatorItems : fanItems;

  return (
    <nav className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto flex w-[min(92%,24rem)] items-center rounded-full bg-ink p-1.5 text-paper shadow-[0_16px_40px_rgba(28,25,21,0.35)]">
      {items.map((item) => {
        const active = item.match(path);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 rounded-full px-3 py-3 text-center text-sm font-medium transition ${
              active ? "bg-paper text-ink" : "text-paper/80"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
