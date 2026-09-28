"use client";
import { useState } from "react";
import Link from "next/link";
export function ExchangePanel({
  slug,
  signedIn,
  isOwner,
}: {
  slug: string;
  signedIn: boolean;
  isOwner: boolean;
}) {
  const [event, setEvent] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function exchange() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, event }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Request failed.");
      setMessage(
        "Request sent. Your card will appear in their incoming requests; they must accept to complete the exchange.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Connection failed. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mx-auto mt-6 max-w-[390px] rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">Exchange agent cards</h2>
      <p className="my-3 text-sm text-black/60">
        Scanning does not share your details. Sending a request shares your
        public card; the other person chooses whether to accept.
      </p>
      {isOwner ? (
        <a href="/connections" className="underline">
          View your exchanges
        </a>
      ) : !signedIn ? (
        <a
          className="underline"
          href={`/api/auth/aicoo/start?returnTo=${encodeURIComponent(`/c/${slug}`)}`}
        >
          Sign in to exchange cards
        </a>
      ) : (
        <>
          <label className="block text-sm">
            Where did you meet? (shared, optional)
            <input
              className="my-2 w-full rounded-xl border p-3"
              maxLength={160}
              value={event}
              onChange={(e) => setEvent(e.target.value)}
            />
          </label>
          <button
            disabled={busy}
            onClick={exchange}
            className="w-full rounded-full bg-black p-3 font-bold text-white disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send my card & request exchange"}
          </button>
          <Link href="/" className="mt-3 block text-sm underline">
            Create or edit my card
          </Link>
        </>
      )}
      <p role="status" className="mt-3 text-sm">
        {message}
      </p>
    </section>
  );
}
