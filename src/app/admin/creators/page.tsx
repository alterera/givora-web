"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type Creator = { id: string; displayName: string; slug: string; status: string };

type TelegramUser = {
  id: string;
  displayName: string | null;
  telegramUsername: string | null;
  createdAt: string;
  creatorProfile: { id: string; slug: string; status: string; displayName: string } | null;
};

export default function AdminCreators() {
  const [rows, setRows] = useState<Creator[]>([]);
  const [telegramUsers, setTelegramUsers] = useState<TelegramUser[]>([]);
  const [promoteUserId, setPromoteUserId] = useState("");
  const [promoteName, setPromoteName] = useState("");
  const [promoteSlug, setPromoteSlug] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    return Promise.all([
      api<Creator[]>("/api/v1/admin/creators").then(setRows),
      api<TelegramUser[]>("/api/v1/admin/telegram-users").then(setTelegramUsers),
    ]);
  }

  useEffect(() => {
    void load().catch((error) => toast.error(error instanceof ApiError ? error.message : "Admin only"));
  }, []);

  async function promote() {
    if (!promoteUserId || !promoteName.trim() || !promoteSlug.trim()) {
      toast.error("Pick a Telegram user and fill display name and slug.");
      return;
    }
    setBusy(true);
    try {
      await api(`/api/v1/admin/users/${promoteUserId}/promote`, {
        method: "POST",
        body: JSON.stringify({ displayName: promoteName.trim(), slug: promoteSlug.trim().toLowerCase() }),
      });
      toast.success("Creator profile created (pending approval).");
      setPromoteUserId("");
      setPromoteName("");
      setPromoteSlug("");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Promotion failed");
    } finally {
      setBusy(false);
    }
  }

  const promotable = telegramUsers.filter((user) => !user.creatorProfile);

  return (
    <div className="mx-auto max-w-3xl space-y-12 px-5 py-12">
      <section>
        <h1 className="font-serif text-4xl">Promote from Telegram</h1>
        <p className="mt-2 text-sm opacity-70">Users appear here after they open the Mini App once. Promotion creates a pending creator profile.</p>
        <div className="mt-6 space-y-3">
          {promotable.length === 0 && <p className="text-sm opacity-60">No Telegram users waiting for promotion.</p>}
          {promotable.map((user) => (
            <button
              key={user.id}
              type="button"
              className={`w-full rounded-3xl p-4 text-left ${promoteUserId === user.id ? "bg-ink text-paper" : "bg-white"}`}
              onClick={() => {
                setPromoteUserId(user.id);
                setPromoteName(user.displayName ?? user.telegramUsername ?? "");
              }}
            >
              <p>{user.displayName ?? "No name"}</p>
              <p className="text-sm opacity-70">@{user.telegramUsername ?? "no username"}</p>
            </button>
          ))}
        </div>
        {promoteUserId && (
          <div className="mt-6 space-y-3 rounded-3xl bg-white p-5">
            <Field label="Display name" value={promoteName} onChange={(e) => setPromoteName(e.target.value)} />
            <Field
              label="Public slug (lowercase, hyphens)"
              value={promoteSlug}
              onChange={(e) => setPromoteSlug(e.target.value)}
            />
            <Button type="button" disabled={busy} onClick={() => void promote()}>
              {busy ? "Creating…" : "Create pending creator"}
            </Button>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-serif text-3xl">Creator profiles</h2>
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
                  onClick={() =>
                    void api(`/api/v1/admin/creators/${row.id}/status`, {
                      method: "PATCH",
                      body: JSON.stringify({ status: "APPROVED" }),
                    }).then(load)
                  }
                >
                  Approve
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
