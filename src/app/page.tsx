export default function HomePage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm uppercase tracking-[0.25em] text-gold">GivoraWorld</p>
      <h1 className="font-serif mt-6 text-4xl leading-tight md:text-5xl">Invite only</h1>
      <p className="mt-6 text-lg leading-relaxed text-ink/75">
        To access GivoraWorld, open the invite link your creator shared with you in Telegram or from their message.
      </p>
      <p className="mt-4 text-sm text-ink/55">There is no public browse — every wishlist opens from a personal link.</p>
    </section>
  );
}
