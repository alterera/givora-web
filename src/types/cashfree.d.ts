declare module "@cashfreepayments/cashfree-js" {
  type RedirectTarget = "_self" | "_blank" | "_top" | "_modal" | HTMLElement;

  export function load(options: { mode: "sandbox" | "production" }): Promise<{
    checkout(options: {
      paymentSessionId: string;
      redirectTarget?: RedirectTarget;
    }): Promise<void>;
  }>;
}
