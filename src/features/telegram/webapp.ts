export type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  initData: string;
  themeParams: Record<string, string>;
  BackButton: { show: () => void; hide: () => void; onClick: (cb: () => void) => void; offClick: (cb: () => void) => void };
  MainButton: { setText: (text: string) => void; show: () => void; hide: () => void; onClick: (cb: () => void) => void; offClick: (cb: () => void) => void };
  HapticFeedback: { impactOccurred: (style: string) => void };
  openLink: (url: string) => void;
  requestWriteAccess: (cb: (granted: boolean) => void) => void;
};

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

export function telegramApp() {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}
