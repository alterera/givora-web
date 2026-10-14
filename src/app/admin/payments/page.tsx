"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { api, ApiError } from "@/lib/api";

export default function AdminPaymentsPage() {
  const [paymentId, setPaymentId] = useState("");
  const [busy, setBusy] = useState(false);

  async function refund(event: React.FormEvent) {
    event.preventDefault();
    if (!paymentId.trim()) return;
    setBusy(true);
    try {
      await api(`/api/v1/admin/payments/${paymentId.trim()}/refunds`, { method: "POST", body: "{}" });
      toast.success("Full payment refund initiated for all gift lines");
      setPaymentId("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Refund failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <AdminPageHeader
        title="Payment refunds"
        description="Refund an entire captured Cashfree payment by internal payment ID. Use after support review; gift Aura is reversed per line automatically."
      />
      <AdminCard className="p-6">
        <form className="space-y-4" onSubmit={refund}>
          <Field
            label="Payment ID (UUID)"
            placeholder="Internal payment id from orders / logs"
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Refunding…" : "Refund full payment"}
          </Button>
        </form>
      </AdminCard>
    </div>
  );
}
