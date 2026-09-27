"use client";
import { useState } from "react";

export function ShareCard({
  url,
  name,
  slug,
}: {
  url: string;
  name: string;
  slug: string;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  async function share() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} — Agentport`, url });
        setMessage(
          "Share dialog closed. Delivery depends on the app you chose.",
        );
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("Card link copied.");
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError"))
        setMessage(
          "Sharing is unavailable. Copy the link below or download the QR.",
        );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="mt-4 rounded-2xl border border-black/10 p-4">
      <summary className="cursor-pointer font-bold">
        Share card / show QR
      </summary>
      <div className="mt-3 space-y-3">
        {!qrFailed && (
          // This same-origin generated PNG must remain directly downloadable.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/qr?text=${encodeURIComponent(url)}&name=${encodeURIComponent(slug)}-card`}
            alt={`Scan to open ${name}'s saved card`}
            width={200}
            height={200}
            className="mx-auto"
            onError={() => setQrFailed(true)}
          />
        )}
        {qrFailed && (
          <p role="status">
            The QR could not load. Share the saved link below, or{" "}
            <button
              type="button"
              className="underline"
              onClick={() => setQrFailed(false)}
            >
              retry the QR
            </button>
            .
          </p>
        )}
        <label className="block text-sm">
          Saved card link
          <input
            readOnly
            value={url}
            onFocus={(event) => event.target.select()}
            className="mt-1 w-full rounded-lg border p-2"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={share}
            className="rounded-full bg-black px-4 py-3 font-bold text-white"
          >
            {busy ? "Opening…" : "Share link"}
          </button>
          <a
            className="rounded-full border px-4 py-3"
            href={`/api/qr?text=${encodeURIComponent(url)}&name=${encodeURIComponent(slug)}-card`}
          >
            Download QR
          </a>
        </div>
        <p role="status" className="text-sm">
          {message}
        </p>
      </div>
    </details>
  );
}
