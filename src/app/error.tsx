"use client";
import Link from "next/link";
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="mx-auto max-w-lg space-y-4 p-6">
      <h1 className="text-2xl font-bold">We could not load this page</h1>
      <p>
        Please try again. If you just saved or exchanged a card, check its
        current state before repeating the action.
      </p>
      {error.digest && (
        <p className="break-all text-sm">Support reference: {error.digest}</p>
      )}
      <button
        onClick={retry}
        className="rounded-full bg-black px-5 py-3 text-white"
      >
        Try again
      </button>
      <Link href="/help" className="block underline">
        Get help
      </Link>
    </main>
  );
}
