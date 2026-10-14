"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { formatInr } from "@/lib/money";

type CosmeticItem = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  pricePaise: number;
  active: boolean;
  ownerCount: number;
  purchaseCount: number;
};

type Purchase = {
  id: string;
  status: string;
  amountPaise: number;
  providerOrderId: string;
  createdAt: string;
  item: { slug: string; name: string };
  user: { id: string; displayName: string | null; telegramUsername: string | null };
};

export default function AdminCosmeticsPage() {
  const [items, setItems] = useState<CosmeticItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  function load() {
    return Promise.all([
      api<CosmeticItem[]>("/api/v1/admin/cosmetics").then(setItems),
      api<Purchase[]>("/api/v1/admin/cosmetics/purchases").then(setPurchases),
    ]);
  }

  useEffect(() => {
    void load().catch((error) => toast.error(error instanceof ApiError ? error.message : "Admin only"));
  }, []);

  async function revoke(purchaseId: string) {
    try {
      await api(`/api/v1/admin/cosmetics/purchases/${purchaseId}/revoke`, { method: "POST", body: "{}" });
      toast.success("Purchase revoked and entitlement removed");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Revoke failed");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <AdminPageHeader
        title="Aura cosmetics"
        description="Catalogue items from seed/migrations. Revoke paid purchases after refunds — does not change earned Aura."
      />

      <AdminCard className="p-6">
        <h2 className="font-serif text-xl">Catalogue</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-[10px] uppercase tracking-wider text-gold">{item.kind}</p>
              <p className="font-medium">{item.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{item.slug}</p>
              <p className="mt-2 text-sm">
                {item.pricePaise === 0 ? "Free" : formatInr(item.pricePaise)} · {item.ownerCount} owners ·{" "}
                {item.purchaseCount} purchases
              </p>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="font-serif text-xl">Recent purchases</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Fan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {purchases.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">{row.item.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.user.displayName ?? row.user.telegramUsername ?? row.user.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{row.status}</td>
                  <td className="px-4 py-3">{formatInr(row.amountPaise)}</td>
                  <td className="px-4 py-3 text-right">
                    {row.status === "PAID" && (
                      <Button type="button" variant="ghost" className="h-8 text-xs" onClick={() => void revoke(row.id)}>
                        Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
