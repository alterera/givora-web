import type { ReactNode } from "react";

export function TgPage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mx-auto w-full max-w-lg px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))] ${className}`}
    >
      {children}
    </div>
  );
}

export function TgCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-[var(--tg-hint-color,rgba(28,25,21,0.08))] bg-[var(--tg-secondary-bg-color,#fff)] p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
