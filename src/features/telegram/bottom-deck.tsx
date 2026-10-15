"use client";

import { usePathname, useRouter } from "next/navigation";
import { Gift, House, Inbox, LayoutDashboard, Send, Sparkles, UserRound } from "lucide-react";
import { Dock, type DockItem } from "@/components/arc/dock/dock";
import { useTelegramSession } from "@/features/telegram/session";

const fanItems: DockItem[] = [
  { id: "/tg", label: "Home", icon: <House /> },
  { id: "/tg/orders", label: "Sent", icon: <Send /> },
  { id: "/tg/aura", label: "Aura", icon: <Sparkles /> },
  { id: "/tg/profile", label: "Profile", icon: <UserRound /> },
];

const creatorItems: DockItem[] = [
  { id: "/tg/creator", label: "Studio", icon: <LayoutDashboard /> },
  { id: "/tg/creator/wishlist", label: "Wishlist", icon: <Gift /> },
  { id: "/tg/creator/gifts", label: "Gifts", icon: <Inbox /> },
  { id: "/tg/aura", label: "Aura", icon: <Sparkles /> },
  { id: "/tg/profile", label: "Profile", icon: <UserRound /> },
];

function selectedId(path: string, items: DockItem[]) {
  const matches = items.filter((item) =>
    item.id === "/tg" ? path === "/tg" : path === item.id || path.startsWith(`${item.id}/`),
  );
  matches.sort((a, b) => b.id.length - a.id.length);
  return matches[0]?.id ?? null;
}

export function BottomDeck() {
  const { status, isCreator } = useTelegramSession();
  const path = usePathname();
  const router = useRouter();

  if (status !== "ready") return null;
  if (path.startsWith("/tg/checkout") || path.startsWith("/tg/return") || path.startsWith("/pay/")) return null;

  const items = isCreator ? creatorItems : fanItems;

  return (
    <div className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-3">
      <Dock
        label="Givora"
        items={items}
        value={selectedId(path, items)}
        onValueChange={(id) => router.push(id)}
      />
    </div>
  );
}
