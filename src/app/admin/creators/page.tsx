"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Copy, ExternalLink, Sparkles, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type Creator = {
  id: string;
  displayName: string;
  slug: string;
  shortCode: string;
  status: "PENDING" | "APPROVED" | "SUSPENDED";
  user?: { telegramUsername?: string | null };
};

type TelegramUser = {
  id: string;
  displayName: string | null;
  telegramUsername: string | null;
  telegramId: string | null;
  createdAt: string;
  creatorProfile: { id: string; slug: string; status: string; displayName: string } | null;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

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
    void load().catch((error) => toast.error(error instanceof ApiError ? error.message : "Sign in as admin first"));
  }, []);

  async function promote() {
    if (!promoteUserId || !promoteName.trim() || !promoteSlug.trim()) {
      toast.error("Select a Telegram user and fill display name and slug.");
      return;
    }
    setBusy(true);
    try {
      const created = await api<{ id: string }>(`/api/v1/admin/users/${promoteUserId}/promote`, {
        method: "POST",
        body: JSON.stringify({ displayName: promoteName.trim(), slug: promoteSlug.trim().toLowerCase() }),
      });
      await api(`/api/v1/admin/creators/${created.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "APPROVED" }),
      });
      toast.success("User promoted & approved as a live creator!");
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

  async function updateStatus(id: string, status: "APPROVED" | "SUSPENDED" | "PENDING") {
    try {
      await api(`/api/v1/admin/creators/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(`Creator status set to ${status}`);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update status");
    }
  }

  const promotable = telegramUsers.filter((user) => !user.creatorProfile);
  const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT ?? "GivoraWorldBot";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <AdminPageHeader
        title="Creators & users"
        description="Promote Telegram Mini App visitors to approved creators and share their wishlist deep links."
      />
      <div className="grid gap-8 lg:grid-cols-12">
      <section className="space-y-4 lg:col-span-5">
        <AdminCard className="p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
            <UserPlus className="h-4 w-4" /> Step 1 · Promote Telegram User
          </div>
          <h1 className="font-serif mt-2 text-2xl">Telegram Users ({promotable.length})</h1>
          <p className="mt-1 text-xs leading-relaxed text-ink/75">
            Anyone who opens the GivoraWorld Mini App in Telegram appears here. Select a user to promote and approve them.
          </p>

          <div className="mt-5 max-h-80 space-y-2 overflow-y-auto pr-1">
            {promotable.length === 0 ? (
              <p className="glass-subtle rounded-2xl p-4 text-center text-xs text-ink/70">
                No unpromoted Telegram users right now.
              </p>
            ) : (
              promotable.map((user) => {
                const selected = promoteUserId === user.id;
                const defaultName = user.displayName || user.telegramUsername || "Creator";
                return (
                  <button
                    key={user.id}
                    type="button"
                    className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition ${
                      selected
                        ? "border-ink bg-ink text-paper"
                        : "glass-subtle hover:opacity-90"
                    }`}
                    onClick={() => {
                      setPromoteUserId(user.id);
                      setPromoteName(defaultName);
                      setPromoteSlug(slugify(user.telegramUsername || defaultName));
                    }}
                  >
                    <div>
                      <p className="font-medium text-sm">{user.displayName ?? "Telegram User"}</p>
                      <p className={`text-xs ${selected ? "text-paper/75" : "text-ink/65"}`}>
                        {user.telegramUsername ? `@${user.telegramUsername}` : `ID ${user.telegramId}`}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${selected ? "bg-paper text-ink" : "glass-subtle text-ink"}`}>
                      {selected ? "Selected" : "Select"}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {promoteUserId && (
            <div className="mt-5 space-y-3 border-t border-ink/10 pt-5">
              <Field
                label="Creator display name"
                value={promoteName}
                onChange={(e) => {
                  setPromoteName(e.target.value);
                  if (!promoteSlug) setPromoteSlug(slugify(e.target.value));
                }}
              />
              <Field
                label="Public wishlist slug"
                value={promoteSlug}
                onChange={(e) => setPromoteSlug(slugify(e.target.value))}
              />
              <Button type="button" className="w-full" disabled={busy} onClick={() => void promote()}>
                {busy ? "Promoting…" : "Promote & Approve Creator"}
              </Button>
            </div>
          )}
        </AdminCard>
      </section>

      <section className="space-y-4 lg:col-span-7">
        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
                <Sparkles className="h-4 w-4" /> Step 2 · Active Creators
              </div>
              <h2 className="font-serif mt-2 text-2xl">Creator Profiles ({rows.length})</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {rows.map((row) => {
              const tgLink = `https://t.me/${bot}?startapp=${row.shortCode}`;
              const isApproved = row.status === "APPROVED";
              return (
                <article
                  key={row.id}
                  className="glass-subtle flex flex-col justify-between gap-4 rounded-2xl p-4 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <p className="font-serif text-xl">{row.displayName}</p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                          isApproved
                            ? "bg-emerald-500/20 text-emerald-300"
                            : row.status === "SUSPENDED"
                              ? "bg-rose/20 text-rose"
                              : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>
                    <p className="text-xs text-ink/75">
                      Slug: <span className="font-mono font-medium">/{row.slug}</span>
                      {row.user?.telegramUsername ? ` · @${row.user.telegramUsername}` : ""}
                    </p>
                    <p className="font-mono text-xs text-ink/65">{tgLink}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="glass-subtle inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-ink hover:opacity-90"
                      onClick={() =>
                        void navigator.clipboard.writeText(tgLink).then(() => toast.success("Telegram link copied"))
                      }
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy TG Link
                    </button>
                    <a
                      href={`/${row.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="glass-subtle inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-ink hover:opacity-90"
                    >
                      Web <ExternalLink className="h-3 w-3" />
                    </a>
                    {!isApproved ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-paper"
                        onClick={() => void updateStatus(row.id, "APPROVED")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="rounded-full border border-rose/25 bg-rose/10 px-3.5 py-1.5 text-xs font-medium text-rose hover:bg-rose/20"
                        onClick={() => void updateStatus(row.id, "SUSPENDED")}
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </AdminCard>
      </section>
      </div>
    </div>
  );
}
