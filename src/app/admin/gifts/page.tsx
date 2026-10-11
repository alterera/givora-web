"use client";

import Link from "next/link";

export default function AdminGiftsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-4xl">Gifts in fulfilment</h1>
      <p className="mt-4 text-ink/70">Claimed gifts become fulfilment orders. Refunds stay on the order record.</p>
      <Link href="/admin/orders" className="mt-6 inline-flex underline">
        Open fulfilment orders
      </Link>
    </div>
  );
}
