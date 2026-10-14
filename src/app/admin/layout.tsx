"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Users, Package, Truck, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { formatInr } from "@/lib/money";

type Stats = {
  paidOrders: number;
  paidPaise: number;
  giftsAwaitingRedemption: number;
  giftsAwaitingFulfilment: number;
  refunds: number;
  refundedPaise: number;
};

const navItems = [
  { href: "/admin/creators", label: "Creators & Users", icon: Users },
  { href: "/admin/products", label: "Catalogue & ₹1 Gift", icon: Package },
  { href: "/admin/orders", label: "Fulfilment & Shipments", icon: Truck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    void api<Stats>("/api/v1/admin/stats")
      .then(setStats)
      .catch(() => undefined);
  }, [path]);

  return (
    <div className="min-h-dvh text-ink">
      <header className="glass-card-strong sticky top-0 z-30 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/creators" className="font-serif text-2xl tracking-tight">
              Givora <span className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-gold">Admin</span>
            </Link>
          </div>

          <nav className="flex flex-wrap items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = path.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    active ? "bg-ink text-paper shadow-sm" : "text-ink/80 hover:bg-ink/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/"
              className="glass-subtle ml-2 inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-xs font-medium text-ink/80 hover:text-ink"
            >
              Storefront <ExternalLink className="h-3 w-3" />
            </Link>
          </nav>
        </div>
      </header>

      {stats && (
        <div className="mx-auto max-w-6xl px-5 pt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wider text-ink/65">Paid Revenue</p>
              <p className="font-serif mt-1 text-2xl">{formatInr(stats.paidPaise)}</p>
              <p className="text-xs text-ink/60">{stats.paidOrders} paid orders</p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wider text-ink/65">Awaiting Redeem</p>
              <p className="font-serif mt-1 text-2xl">{stats.giftsAwaitingRedemption}</p>
              <p className="text-xs text-ink/60">Unwrapped / pending address</p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wider text-ink/65">In Fulfilment</p>
              <p className="font-serif mt-1 text-2xl">{stats.giftsAwaitingFulfilment}</p>
              <p className="text-xs text-ink/60">Pending pack or transit</p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wider text-ink/65">Refunded</p>
              <p className="font-serif mt-1 text-2xl">{formatInr(stats.refundedPaise)}</p>
              <p className="text-xs text-ink/60">{stats.refunds} refunds</p>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
    </div>
  );
}
