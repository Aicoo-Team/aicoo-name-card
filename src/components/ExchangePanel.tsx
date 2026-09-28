"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { requestJson } from "@/lib/client-request";
export function ExchangePanel({
  slug,
  signedIn,
  isOwner,
  hasCard,
}: {
  slug: string;
  signedIn: boolean;
  isOwner: boolean;
  hasCard: boolean;
}) {
  const [event, setEvent] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const locked = useRef(false);
  const editorUrl = `/?returnTo=${encodeURIComponent(`/c/${slug}`)}`;
  async function exchange() {
    if (locked.current || sent) return;
    locked.current = true;
    setBusy(true);
    setMessage("");
    try {
      await requestJson("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, event }),
      });
      setSent(true);
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
      locked.current = false;
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
      ) : !hasCard ? (
        <div>
          <p className="mb-3 text-sm">
            Create your card first so the other person knows who is asking.
            After saving, you will return here to confirm the exchange.
          </p>
          <Link
            className="block rounded-full bg-black p-3 text-center font-bold text-white"
            href={editorUrl}
          >
            Create my card & return
          </Link>
        </div>
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
            disabled={busy || sent}
            onClick={exchange}
            className="w-full rounded-full bg-black p-3 font-bold text-white disabled:opacity-50"
          >
            {sent
              ? "Request sent"
              : busy
                ? "Sending…"
                : "Send my card & request exchange"}
          </button>
          <Link href={editorUrl} className="mt-3 block text-sm underline">
            Create or edit my card
          </Link>
        </>
      )}
      <p role="status" className="mt-3 text-sm">
        {message}
      </p>
      {signedIn && !isOwner && (
        <Link href="/connections" className="mt-3 block text-sm underline">
          Check incoming and sent requests →
        </Link>
      )}
    </section>
  );
}
