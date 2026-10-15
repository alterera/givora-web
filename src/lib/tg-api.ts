import { apiBase } from "./utils";
import { ApiError } from "./api";
import { telegramApp } from "@/features/telegram/webapp";

export type TgAccount = {
  id: string;
  displayName: string | null;
  telegramUsername: string | null;
  role: "CUSTOMER" | "ADMIN";
  createdAt: string;
};

export type TgBoot = {
  user: TgAccount;
  isCreator: boolean;
  creatorSlug: string | null;
};

const BOOT_STORAGE_KEY = "givora-tg-boot";

/** Same-origin in the Mini App (Vercel rewrite); absolute URL only when not in a browser. */
export function tgApiUrl(path: string) {
  if (typeof window !== "undefined") return path;
  const base = apiBase().replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function readCachedTgBoot(): TgBoot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BOOT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TgBoot) : null;
  } catch {
    return null;
  }
}

export function cacheTgBoot(boot: TgBoot) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(BOOT_STORAGE_KEY, JSON.stringify(boot));
    window.dispatchEvent(new CustomEvent("givora-tg-boot", { detail: boot }));
  } catch {
    // ignore quota errors
  }
}

function applyTelegramHeaders(headers: Headers) {
  headers.set("X-Requested-With", "givora");
  const initData = telegramApp()?.initData;
  if (initData) headers.set("X-Telegram-Init-Data", initData);
}

export function provisionalTgAccount(): TgAccount | null {
  const user = telegramApp()?.initDataUnsafe?.user;
  if (!user) return null;
  const cached = readCachedTgBoot();
  if (cached?.user.id) return cached.user;
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Telegram user";
  return {
    id: "",
    displayName,
    telegramUsername: user.username ?? null,
    role: "CUSTOMER",
    createdAt: new Date().toISOString(),
  };
}

/** @deprecated Mini App uses initData on each request; kept for legacy callers. */
export function ensureTelegramSession() {
  const account = provisionalTgAccount();
  return Promise.resolve(account);
}

export function tgToken() {
  return null;
}

export async function tgApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  applyTelegramHeaders(headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(tgApiUrl(path), { ...init, headers });
  const text = await response.text();
  const body = text ? (JSON.parse(text) as { code?: string; message?: string }) : {};
  if (!response.ok) {
    throw new ApiError(body.code ?? "REQUEST_FAILED", body.message ?? "Request failed", response.status);
  }
  return body as T;
}

export async function refreshTgBoot(): Promise<TgBoot | null> {
  const initData = telegramApp()?.initData;
  if (!initData) return null;
  try {
    const boot = await tgApi<TgBoot>("/api/v1/tg/boot");
    cacheTgBoot(boot);
    return boot;
  } catch {
    return null;
  }
}
