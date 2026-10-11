import { apiBase } from "./utils";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

let refreshing: Promise<boolean> | null = null;

async function refreshSession() {
  if (!refreshing) {
    refreshing = fetch(`${apiBase()}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "X-Requested-With": "givora" },
    })
      .then((response) => response.ok)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("X-Requested-With", "givora");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  if (response.status === 401 && retry && !path.includes("/auth/")) {
    const ok = await refreshSession();
    if (ok) return api<T>(path, init, false);
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      // Shared fetch helper, not a component, so it cannot call the Next router.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- session expiry must leave any page
      window.location.assign(`${window.location.origin}/login?next=${next}`);
    }
  }
  const text = await response.text();
  const body = text ? (JSON.parse(text) as { code?: string; message?: string }) : {};
  if (!response.ok) {
    throw new ApiError(body.code ?? "REQUEST_FAILED", body.message ?? "Request failed", response.status);
  }
  return body as T;
}

export function idempotencyKey(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}
