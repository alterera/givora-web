import { telegramApp } from "@/features/telegram/webapp";

/** Opens Cashfree hosted checkout outside the Telegram WebView when possible. */
export function openCashfreeCheckout(hostedUrl: string) {
  const app = telegramApp();
  if (app) {
    app.openLink(hostedUrl);
    return;
  }
  window.open(hostedUrl, "_blank", "noopener,noreferrer");
}
