const pages: Record<string, { title: string; body: string[] }> = {
  terms: {
    title: "Terms",
    body: [
      "Givora sells gifts on behalf of the sender. The sender pays before a redeem link exists.",
      "A recipient claims a gift by verifying a mobile number and providing a delivery address in India.",
      "Prices are in Indian rupees. The amount charged is calculated on our servers.",
    ],
  },
  privacy: {
    title: "Privacy",
    body: [
      "We store the sender account, the gift note, payment references, and the recipient address needed to deliver.",
      "Redeem links are stored only as a hash. Gift pages are not indexed and do not leak the note into link previews.",
      "WhatsApp numbers are used for one-time codes and gift status messages.",
    ],
  },
  refunds: {
    title: "Refunds and cancellation",
    body: [
      "An unpaid order expires automatically and is not charged.",
      "A paid gift that is not redeemed within 30 days is refunded in full.",
      "A digital file that has been downloaded is not refundable.",
      "After redemption, refunds are handled by an admin when the gift cannot be delivered.",
    ],
  },
  shipping: {
    title: "Shipping",
    body: [
      "We ship within India. The recipient adds the address only after opening the gift.",
      "Shipping fees, when charged, are calculated before payment and shown in the gift total.",
      "Tracking is added by our team once the parcel leaves.",
    ],
  },
  contact: {
    title: "Contact",
    body: ["Write to hello@givora.in for an order, a refund, or a gift that will not open."],
  },
};

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug] ?? { title: "Givora", body: ["This page is not written yet."] };
  return (
    <article className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="font-serif text-5xl">{page.title}</h1>
      <div className="mt-6 space-y-4 text-lg text-ink/80">
        {page.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
