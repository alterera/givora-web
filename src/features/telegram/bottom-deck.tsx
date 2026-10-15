"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Gift, House, Inbox, LayoutDashboard, Send, UserRound } from "lucide-react";
import { Dock, type DockItem } from "@/components/arc/dock/dock";
import { useTelegramSession } from "@/features/telegram/session";
import { tgApi } from "@/lib/tg-api";

const fanItems: DockItem[] = [
  { id: "/tg", label: "Home", icon: <House /> },
  { id: "/tg/orders", label: "Sent", icon: <Send /> },
  { id: "/tg/profile", label: "Profile", icon: <UserRound /> },
];

const creatorItems: DockItem[] = [
  { id: "/tg/creator", label: "Studio", icon: <LayoutDashboard /> },
  { id: "/tg/creator/wishlist", label: "Wishlist", icon: <Gift /> },
  { id: "/tg/creator/gifts", label: "Gifts", icon: <Inbox /> },
  { id: "/tg/profile", label: "Profile", icon: <UserRound /> },
];

function selectedId(path: string, items: DockItem[]) {
  const match = items.find((item) => (item.id === "/tg" ? path === "/tg" : path.startsWith(item.id)));
  return match?.id ?? items[0]?.id ?? null;
}

export function BottomDeck() {
  const { status } = useTelegramSession();
  const path = usePathname();
  const router = useRouter();
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
