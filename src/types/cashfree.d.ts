declare module "@cashfreepayments/cashfree-js" {
  export type RedirectTarget = "_self" | "_blank" | "_top" | "_modal" | HTMLElement;

  export type CheckoutAppearance = {
    width?: string;
    height?: string;
    borderColor?: string;
    backgroundColor?: string;
    borderWidth?: string;
    borderRadius?: string;
  };

  export type CheckoutOptions = {
    paymentSessionId: string;
    redirectTarget?: RedirectTarget;
    returnUrl?: string;
    appearance?: CheckoutAppearance;
    headerless?: boolean;
  };

  export type CheckoutResult = {
    error?: {
      code?: string;
      message?: string;
      type?: string;
    };
    redirect?: boolean;
    paymentDetails?: {
      paymentMessage?: string;
    };
  };

  export type CashfreeInstance = {
    checkout(options: CheckoutOptions, checkForPayFast?: boolean): Promise<CheckoutResult | undefined>;
  };

  export function load(options: { mode: "sandbox" | "production" }): Promise<CashfreeInstance | null>;
}
