"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const path = usePathname();
  if (path.startsWith("/tg") || path.startsWith("/pay/") || path.startsWith("/admin")) return null;
  return (
    <header className="glass-card sticky top-0 z-30 border-x-0 border-t-0">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-serif text-2xl tracking-tight text-ink">
          Givora
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const path = usePathname();
  if (path.startsWith("/tg") || path.startsWith("/pay/") || path.startsWith("/admin")) return null;
  return (
    <footer className="glass-subtle mt-auto border-x-0 border-b-0">
      <div className="mx-auto flex max-w-6xl flex-wrap gap-4 px-5 py-8 text-sm text-ink/75">
        <span>Gifts, not carts.</span>
        <Link href="/legal/privacy" className="hover:text-ink">
          Privacy
        </Link>
        <Link href="/legal/terms" className="hover:text-ink">
          Terms
        </Link>
        <Link href="/legal/refunds" className="hover:text-ink">
          Refunds
        </Link>
      </div>
    </footer>
  );
}
