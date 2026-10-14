import type { RefObject } from "react";

export type CashfreeMode = "sandbox" | "production";

export type CashfreeCheckoutResult =
  | { ok: true; mode: "inline" | "redirect" | "modal" }
  | { ok: false; reason: string };

async function loadCashfree(mode: CashfreeMode) {
  const { load } = await import("@cashfreepayments/cashfree-js");
  return load({ mode });
}

/** Start Cashfree inside the Mini App. Inline checkout is fire-and-forget; redirect/modal are attempted on failure. */
export async function tryCashfreeInMiniApp(
  paymentSessionId: string,
  mode: CashfreeMode,
  containerRef: RefObject<HTMLElement | null>,
): Promise<CashfreeCheckoutResult> {
  const cashfree = await loadCashfree(mode);
  const container = containerRef.current;
  if (container) {
    container.replaceChildren();
    void cashfree.checkout({ paymentSessionId, redirectTarget: container }).catch(() => undefined);
    return { ok: true, mode: "inline" };
  }

  try {
    await cashfree.checkout({ paymentSessionId, redirectTarget: "_self" });
    return { ok: true, mode: "redirect" };
  } catch {
    // continue
  }

  try {
    await cashfree.checkout({ paymentSessionId, redirectTarget: "_modal" });
    return { ok: true, mode: "modal" };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Checkout could not open";
    return { ok: false, reason };
  }
}
