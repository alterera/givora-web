import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-serif text-2xl tracking-tight">
          Givora
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/gifts" className="hover:text-gold">
            Gifts
          </Link>
          <Link href="/account/gifts" className="hover:text-gold">
            Sent
          </Link>
          <Link href="/login" className="rounded-full bg-ink px-4 py-2 text-paper">
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-ink/10">
      <div className="mx-auto flex max-w-6xl flex-wrap gap-4 px-5 py-8 text-sm text-ink/70">
        <span>Gifts, not carts.</span>
        <Link href="/legal/terms">Terms</Link>
        <Link href="/legal/privacy">Privacy</Link>
        <Link href="/legal/refunds">Refunds</Link>
        <Link href="/legal/shipping">Shipping</Link>
        <Link href="/legal/contact">Contact</Link>
      </div>
    </footer>
  );
}
