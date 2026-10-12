"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

type Creator = { id: string; displayName: string; slug: string; status: string };

export default function AdminCreators() {
  const [rows, setRows] = useState<Creator[]>([]);
  function load() {
    return api<Creator[]>("/api/v1/admin/creators").then(setRows);
  }
  useEffect(() => {
    void load().catch((error) => toast.error(error instanceof ApiError ? error.message : "Admin only"));
  }, []);
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-4xl">Creators</h1>
      <div className="mt-6 space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="flex items-center justify-between rounded-3xl bg-white p-4">
            <div>
              <p>{row.displayName}</p>
              <p className="text-sm opacity-70">{row.slug} · {row.status}</p>
            </div>
            {row.status !== "APPROVED" && (
              <button
                type="button"
                className="rounded-full bg-ink px-4 py-2 text-paper"
                onClick={() => void api(`/api/v1/admin/creators/${row.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "APPROVED" }) }).then(load)}
              >
                Approve
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
