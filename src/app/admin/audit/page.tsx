"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { api, ApiError } from "@/lib/api";

type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  actorId: string | null;
  metadata: unknown;
  createdAt: string;
};

export default function AdminAuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);

  useEffect(() => {
    void api<AuditRow[]>("/api/v1/admin/audit-logs")
      .then(setRows)
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Admin only"));
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <AdminPageHeader
        title="Audit log"
        description="Recent privileged actions (promotions, refunds, aura adjustments, shipment updates)."
      />
      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No audit entries yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/20">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {new Date(row.createdAt).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{row.action}</td>
                    <td className="px-4 py-3">
                      <span className="text-muted-foreground">{row.entity}</span>
                      <span className="ml-1 font-mono text-xs">{row.entityId.slice(0, 12)}…</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {row.actorId?.slice(0, 12) ?? "—"}…
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
