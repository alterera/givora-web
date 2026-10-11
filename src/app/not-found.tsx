import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <h1 className="font-serif text-5xl">That page is not here</h1>
      <Link href="/gifts" className="mt-6 inline-flex underline">
        Browse gifts
      </Link>
    </div>
  );
}
