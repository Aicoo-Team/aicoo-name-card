"use client";
import { useState } from "react";
import Link from "next/link";
import type { NameCard } from "@/lib/types";
export type Connection = {
  id: string;
  status: string;
  event: string;
  incoming: boolean;
  card: NameCard;
  note: string;
  sync_status: string;
  created_at: string;
};
export function Connections({
  initial,
  error,
}: {
  initial: Connection[];
  error: string;
}) {
  const [items, setItems] = useState(initial),
    [message, setMessage] = useState(error),
    [busy, setBusy] = useState("");
  async function action(id: string, action: string, note?: string) {
    setBusy(id);
    setMessage("");
    try {
      const response = await fetch(
        `/api/connections/${id}${action === "sync" ? "/sync" : ""}`,
        {
          method: action === "sync" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, note }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Request failed.");
      const refreshed = await fetch("/api/connections");
      const payload = await refreshed.json();
      if (!refreshed.ok)
        throw new Error(payload.error || "Refresh failed. Reload the page.");
      setItems(payload.connections);
      setMessage(
        action === "sync"
          ? `Aicoo status: ${result.status}. A request is not yet a confirmed contact.`
          : "Saved.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please retry.");
    } finally {
      setBusy("");
    }
  }
  return (
    <main className="mx-auto max-w-3xl p-6 text-black">
      <Link className="underline" href="/">
        ← My card
      </Link>
      <h1 className="my-6 text-3xl font-bold">Card exchanges</h1>
      <p className="mb-5 text-sm">
        Incoming requests require your acceptance. Notes are private. Connecting
        on Aicoo is a separate, explicit action and does not grant agent access.
      </p>
      <p role="status" className="my-4">
        {message}
      </p>
      {!items.length && !error && (
        <p>
          No exchanges yet. Share your card QR, or scan someone else’s card.
        </p>
      )}
      {items.map((item) => (
        <section key={item.id} className="my-4 rounded-2xl border bg-white p-5">
          <a
            href={`/c/${item.card.slug}`}
            className="text-xl font-bold underline"
          >
            {item.card.name}
          </a>
          <p className="my-2 text-sm">
            {item.incoming ? "Incoming" : "Outgoing"} · {item.status} ·{" "}
            {new Date(item.created_at).toLocaleDateString()}
            {item.event ? ` · ${item.event}` : ""}
          </p>
          {item.status === "pending" && (
            <div className="flex gap-3">
              {(item.incoming ? ["accept", "reject"] : ["cancel"]).map((a) => (
                <button
                  className="rounded-full border px-4 py-2"
                  key={a}
                  disabled={!!busy}
                  onClick={() => action(item.id, a)}
                >
                  {a}
                </button>
              ))}
            </div>
          )}
          {item.status === "accepted" && (
            <div className="my-3">
              <button
                className="rounded-full bg-black px-4 py-2 text-white disabled:opacity-50"
                disabled={!!busy || !item.card.aicooUsername}
                onClick={() => action(item.id, "sync")}
              >
                Connect on Aicoo
              </button>
              <p className="mt-2 text-sm">
                Last confirmed status: {item.sync_status}
                {!item.card.aicooUsername
                  ? " · Verified Aicoo username unavailable"
                  : ""}
              </p>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              void action(item.id, "note", String(data.get("note") || ""));
            }}
          >
            <label className="mt-4 block text-sm">
              Private note
              <textarea
                key={`${item.id}-${item.note}`}
                name="note"
                defaultValue={item.note}
                maxLength={2000}
                className="my-2 w-full rounded-xl border p-3"
              />
            </label>
            <button disabled={!!busy} className="underline">
              Save note
            </button>
          </form>
        </section>
      ))}
      {items.length === 200 && <p>Showing the 200 most recent exchanges.</p>}
    </main>
  );
}
