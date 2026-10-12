import { apiBase } from "./utils";
import { ApiError } from "./api";
import { telegramApp } from "@/features/telegram/webapp";

let accessToken: string | null = null;
let signingIn: Promise<boolean> | null = null;

export function tgToken() {
  return accessToken;
}

async function signIn() {
  const initData = telegramApp()?.initData;
  if (!initData) return false;
  if (!signingIn) {
    signingIn = fetch(`${apiBase()}/api/v1/auth/telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "givora" },
      body: JSON.stringify({ initData }),
    })
      .then(async (response) => {
        if (!response.ok) return false;
        const body = (await response.json()) as { accessToken: string };
        accessToken = body.accessToken;
        return true;
      })
      .finally(() => {
        signingIn = null;
      });
  }
  return signingIn;
}

export async function tgApi<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  if (!accessToken) await signIn();
  const headers = new Headers(init.headers);
  headers.set("X-Requested-With", "givora");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${apiBase()}${path}`, { ...init, headers });
  if (response.status === 401 && retry) {
    accessToken = null;
    if (await signIn()) return tgApi<T>(path, init, false);
  }
  const text = await response.text();
  const body = text ? (JSON.parse(text) as { code?: string; message?: string }) : {};
  if (!response.ok) throw new ApiError(body.code ?? "REQUEST_FAILED", body.message ?? "Request failed", response.status);
  return body as T;
}
