"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { api, ApiError } from "@/lib/api";

export default function AdminAuraPage() {
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("10");
  const [reason, setReason] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => `adj-${Date.now()}`);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await api<{ earnedAura: number }>("/api/v1/admin/aura/adjustments", {
        method: "POST",
        body: JSON.stringify({
          userId: userId.trim(),
          amount: Number(amount),
          reason: reason.trim(),
          idempotencyKey,
        }),
      });
      toast.success(`Aura updated. User now has ${result.earnedAura} earned Aura.`);
      setIdempotencyKey(`adj-${Date.now()}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Adjustment failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <AdminPageHeader
        title="Aura adjustments"
        description="Manual earned-Aura corrections. Every change is written to the ledger and audit log. Use negative amounts to deduct."
      />
      <AdminCard className="p-6">
        <form className="space-y-4" onSubmit={submit}>
          <Field label="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} required />
          <Field
            label="Amount (signed)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Field label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
          <Field
            label="Idempotency key"
            value={idempotencyKey}
            onChange={(e) => setIdempotencyKey(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Applying…" : "Apply adjustment"}
          </Button>
        </form>
      </AdminCard>
    </div>
  );
}
