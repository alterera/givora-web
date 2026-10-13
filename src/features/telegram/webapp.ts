export type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
    };
    start_param?: string;
  };
  themeParams: Record<string, string>;
  viewportStableHeight?: number;
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
