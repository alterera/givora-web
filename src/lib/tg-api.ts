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

let accessToken: string | null = null;
let account: TgAccount | null = null;
let signingIn: Promise<TgAccount | null> | null = null;

export function tgToken() {
  return accessToken;
}

export function ensureTelegramSession() {
  if (account && accessToken) return Promise.resolve(account);
  const initData = telegramApp()?.initData;
  if (!initData) return Promise.resolve(null);
  if (!signingIn) {
    signingIn = fetch(`${apiBase()}/api/v1/auth/telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "givora" },
      body: JSON.stringify({ initData }),
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const body = (await response.json()) as { accessToken: string; user: TgAccount };
        accessToken = body.accessToken;
        account = body.user;
        return account;
      })
      .catch(() => null)
      .finally(() => {
        signingIn = null;
      });
  }
  return signingIn;
}

export async function tgApi<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  if (!accessToken) await ensureTelegramSession();
  const headers = new Headers(init.headers);
  headers.set("X-Requested-With", "givora");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${apiBase()}${path}`, { ...init, headers });
  if (response.status === 401 && retry) {
    accessToken = null;
    account = null;
    if (await ensureTelegramSession()) return tgApi<T>(path, init, false);
  }
  const text = await response.text();
  const body = text ? (JSON.parse(text) as { code?: string; message?: string }) : {};
  if (!response.ok) throw new ApiError(body.code ?? "REQUEST_FAILED", body.message ?? "Request failed", response.status);
  return body as T;
}
