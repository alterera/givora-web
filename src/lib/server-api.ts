import { cookies } from "next/headers";
import { apiBase } from "./utils";

export async function serverApi<T>(path: string): Promise<T | null> {
  const jar = await cookies();
  const response = await fetch(`${apiBase()}/api/v1${path}`, {
    headers: {
      cookie: jar.toString(),
      "X-Requested-With": "givora",
    },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return (await response.json()) as T;
}

export async function publicApi<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${apiBase()}/api/v1${path}`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
