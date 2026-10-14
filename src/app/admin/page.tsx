"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    void api<Stats>("/api/v1/admin/stats").then(setStats).catch(() => setStats(null));
  }, []);

  const shortcuts = [
    { href: "/admin/creators", label: "Promote a Telegram user", hint: "Creators & Users" },
    { href: "/admin/products", label: "Add catalogue product", hint: "Catalogue" },
    { href: "/admin/orders", label: "Update shipment tracking", hint: "Shipments" },
    { href: "/admin/cosmetics", label: "Review cosmetic purchases", hint: "Aura Cosmetics" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <AdminPageHeader
        title="Dashboard"
        description="Live snapshot of revenue, gifts, and fulfilment. Sign in with an admin account to load data."
      />

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminCard className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Paid revenue</p>
            <p className="font-serif mt-2 text-3xl">{formatInr(stats.paidPaise)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stats.paidOrders} paid orders</p>
          </AdminCard>
          <AdminCard className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Awaiting redeem</p>
            <p className="font-serif mt-2 text-3xl">{stats.giftsAwaitingRedemption}</p>
            <p className="mt-1 text-xs text-muted-foreground">Unwrapped / pending address</p>
          </AdminCard>
          <AdminCard className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">In fulfilment</p>
            <p className="font-serif mt-2 text-3xl">{stats.giftsAwaitingFulfilment}</p>
            <p className="mt-1 text-xs text-muted-foreground">Pack or ship queue</p>
          </AdminCard>
          <AdminCard className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Refunded</p>
            <p className="font-serif mt-2 text-3xl">{formatInr(stats.refundedPaise)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stats.refunds} refunds</p>
          </AdminCard>
        </div>
      ) : (
        <AdminCard className="p-6 text-sm text-muted-foreground">
          Could not load stats. Open{" "}
          <Link href="/login" className="text-gold underline">
            /login
          </Link>{" "}
          as an admin, then return here.
        </AdminCard>
      )}

      <AdminCard className="divide-y divide-border">
        <div className="p-5">
          <h2 className="font-serif text-xl">Quick actions</h2>
        </div>
        <ul>
          {shortcuts.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-muted/40"
              >
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.hint}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </AdminCard>
    </div>
  );
}
