"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTelegramSession } from "@/features/telegram/session";

const items = [
  { href: "/tg", label: "Home" },
  { href: "/tg/orders", label: "Sent" },
  { href: "/tg/profile", label: "Profile" },
];

export function BottomDeck() {
  const { status } = useTelegramSession();
  const path = usePathname();
  if (status !== "ready") return null;
  return (
    <nav className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto flex w-[min(92%,22rem)] items-center rounded-full bg-ink p-1.5 text-paper shadow-[0_16px_40px_rgba(28,25,21,0.35)]">
      {items.map((item) => {
        const active = item.href === "/tg" ? path === "/tg" : path.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 rounded-full px-3 py-3 text-center text-sm transition ${active ? "bg-paper text-ink" : "text-paper/80"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
