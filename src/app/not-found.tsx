import Link from "next/link";
export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg space-y-4 p-6">
      <h1 className="text-2xl font-bold">
        This card or page could not be found
      </h1>
      <p>
        The address may have changed. Ask the person for their latest card link
        or scan their QR again.
      </p>
      <Link href="/" className="block underline">
        Go to my card
      </Link>
      <Link href="/help" className="block underline">
        Help
      </Link>
    </main>
  );
}
