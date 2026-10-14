import type { CashfreeInstance, CheckoutResult } from "@cashfreepayments/cashfree-js";

export type CashfreeMode = "sandbox" | "production";

const sdkInstances = new Map<CashfreeMode, Promise<CashfreeInstance | null>>();

/**
 * Initialise Cashfree SDK once per mode at module scope (never re-instantiate per click).
 */
export function getCashfree(mode: CashfreeMode): Promise<CashfreeInstance | null> {
  let existing = sdkInstances.get(mode);
  if (!existing) {
    existing = import("@cashfreepayments/cashfree-js").then(({ load }) => load({ mode }));
    sdkInstances.set(mode, existing);
  }
  return existing;
}

/**
 * Mounts Cashfree inline checkout inside a DOM container with 100% mobile-friendly width.
 * Returns the SDK Promise which resolves when payment completes, redirects, or is closed.
 */
export async function startInlineCheckout(
  paymentSessionId: string,
  mode: CashfreeMode,
  container: HTMLElement,
): Promise<CheckoutResult | undefined> {
  const cashfree = await getCashfree(mode);
  if (!cashfree) {
    return { error: { code: "sdk_unavailable", message: "Cashfree SDK could not load." } };
  }
  container.replaceChildren();
  return cashfree.checkout({
    paymentSessionId,
    redirectTarget: container,
    appearance: {
      width: "100%",
      height: "640px",
    },
  });
}

/**
 * Opens Cashfree Drop-in modal overlay inside the current WebView/page.
 */
export async function startModalCheckout(
  paymentSessionId: string,
  mode: CashfreeMode,
): Promise<CheckoutResult | undefined> {
  const cashfree = await getCashfree(mode);
  if (!cashfree) {
    return { error: { code: "sdk_unavailable", message: "Cashfree SDK could not load." } };
  }
  return cashfree.checkout({
    paymentSessionId,
    redirectTarget: "_modal",
  });
}

/**
 * Navigates the current window directly to Cashfree's hosted checkout page (skips PayFast iframe check on mobile).
 */
export async function startRedirectCheckout(
  paymentSessionId: string,
  mode: CashfreeMode,
  target: "_self" | "_top" = "_self",
): Promise<CheckoutResult | undefined> {
  const cashfree = await getCashfree(mode);
  if (!cashfree) {
    return { error: { code: "sdk_unavailable", message: "Cashfree SDK could not load." } };
  }
  return cashfree.checkout(
    {
      paymentSessionId,
      redirectTarget: target,
    },
    false,
  );
}
