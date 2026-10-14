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
    <div className={`glass-card rounded-3xl p-4 text-ink ${className}`}>
      {children}
    </div>
  );
}
