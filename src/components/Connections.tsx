"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  exchangeQuery,
  type Connection,
  type ExchangeFilters,
  type ExchangeView,
} from "@/lib/exchange-view";
import { requestJson } from "@/lib/client-request";
export function Connections({
  initial,
  error,
  initialHasMore,
  contactsEnabled,
}: {
  initial: Connection[];
  error: string;
  initialHasMore: boolean;
  contactsEnabled: boolean;
}) {
  const [items, setItems] = useState(initial),
    [message, setMessage] = useState(error),
    [busy, setBusy] = useState("");
  const locked = useRef(false);
  const [filters, setFilters] = useState<ExchangeFilters>({
    q: "",
    view: "all",
    page: 1,
  });
  const [query, setQuery] = useState("");
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const hasDrafts = Object.keys(drafts).length > 0;
  useEffect(() => {
    if (!hasDrafts) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasDrafts]);
  async function load(next: ExchangeFilters) {
    const payload = await requestJson<{
      connections: Connection[];
      hasMore: boolean;
    }>(`/api/connections?${exchangeQuery(next)}`);
    setItems(payload.connections);
    setHasMore(payload.hasMore);
    setFilters(next);
  }
  async function browse(next: ExchangeFilters) {
    if (locked.current) return;
    if (
      Object.keys(drafts).length &&
      !window.confirm(
        "Leave unsaved notes? Your edits remain here until you reload or leave this page.",
      )
    )
      return;
    locked.current = true;
    setBusy("browse");
    setMessage("");
    try {
      await load(next);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not refresh exchanges.",
      );
    } finally {
      locked.current = false;
      setBusy("");
    }
  }
  async function action(id: string, action: string, note?: string) {
    if (locked.current) return;
    if (
      action === "archive" &&
      !window.confirm(
        "Archive this exchange from your list? This does not remove the other person's record or revoke agent access.",
      )
    )
      return;
    locked.current = true;
    setBusy(id);
    setMessage("");
    try {
      const result = await requestJson<{ status?: string }>(
        `/api/connections/${id}${action === "sync" ? "/sync" : ""}`,
        {
          method: action === "sync" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, note }),
        },
      );
      if (action === "note")
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      try {
        await load(filters);
      } catch {
        setMessage(
          "Your change was saved, but the list could not refresh. Use Refresh before making another change.",
        );
        return;
      }
      setMessage(
        action === "sync"
          ? `Aicoo status: ${result.status}. A request is not yet a confirmed contact.`
          : "Saved.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please retry.");
    } finally {
      locked.current = false;
      setBusy("");
    }
  }
  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6 text-black">
      <Link
        className="underline"
        href="/"
        onClick={(event) => {
          if (
            hasDrafts &&
            !window.confirm(
              "Discard unsaved private notes and leave this page?",
            )
          )
            event.preventDefault();
        }}
      >
        ← My card
      </Link>
      <h1 className="my-6 text-3xl font-bold">Card exchanges</h1>
      <p className="mb-5 text-sm">
        Incoming requests require your acceptance. Notes are private. Connecting
        on Aicoo is a separate, explicit action and does not grant agent access.
      </p>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void browse({ ...filters, q: query.trim(), page: 1 });
        }}
      >
        <label className="min-w-0 flex-1">
          Search by name or company
          <input
            type="search"
            value={query}
            maxLength={120}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-1 w-full rounded-xl border bg-white p-3"
          />
        </label>
        <button disabled={!!busy} className="self-end rounded-xl border p-3">
          Search
        </button>
      </form>
      <div className="my-4 flex flex-wrap gap-2" aria-label="Exchange filters">
        {Object.entries({
          all: "All",
          accepted: "Contacts",
          incoming: "Incoming requests",
          outgoing: "Sent requests",
          history: "History",
          archived: "Archived",
        }).map(([view, label]) => (
          <button
            key={view}
            disabled={!!busy}
            aria-pressed={filters.view === view}
            className={`rounded-full border px-3 py-2 ${filters.view === view ? "bg-black text-white" : "bg-white"}`}
            onClick={() =>
              void browse({ q: filters.q, view: view as ExchangeView, page: 1 })
            }
          >
            {label}
          </button>
        ))}
        <button
          disabled={!!busy}
          className="px-3 py-2 underline"
          onClick={() => void browse(filters)}
        >
          {busy === "browse" ? "Loading…" : "Refresh"}
        </button>
      </div>
      <p role="status" className="my-4">
        {message}
      </p>
      {!items.length && !busy && (
        <p>
          No exchanges in this view. Try another filter or share your card QR.
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
          <p className="text-sm">{item.card.company}</p>
          <p className="my-2 text-sm">
            {item.incoming ? "Incoming" : "Outgoing"} · {item.status} ·{" "}
            {new Date(item.created_at).toISOString().slice(0, 10)}
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
          {item.status === "accepted" && contactsEnabled && (
            <div className="my-3">
              <button
                className="rounded-full bg-black px-4 py-2 text-white disabled:opacity-50"
                disabled={!!busy || !item.canSync}
                onClick={() => action(item.id, "sync")}
              >
                Connect on Aicoo
              </button>
              <p className="mt-2 text-sm">
                Last confirmed status: {item.sync_status}
                {!item.canSync ? " · Verified Aicoo username unavailable" : ""}
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
                name="note"
                value={drafts[item.id] ?? item.note}
                onChange={(event) =>
                  setDrafts((prev) => {
                    const next = { ...prev };
                    if (event.target.value === item.note) delete next[item.id];
                    else next[item.id] = event.target.value;
                    return next;
                  })
                }
                disabled={!!busy}
                maxLength={2000}
                className="my-2 w-full rounded-xl border p-3"
              />
            </label>
            <button disabled={!!busy} className="underline">
              Save note
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-4">
            <a
              className="underline"
              href={`/api/cards/${item.card.slug}/vcard`}
            >
              Save to phone
            </a>
            {item.status !== "pending" && (
              <button
                disabled={!!busy}
                className="underline"
                onClick={() =>
                  void action(item.id, item.archived ? "restore" : "archive")
                }
              >
                {item.archived ? "Restore to my list" : "Archive from my list"}
              </button>
            )}
          </div>
        </section>
      ))}
      <nav
        aria-label="Exchange pages"
        className="my-6 flex items-center justify-between gap-4"
      >
        <button
          disabled={!!busy || filters.page === 1}
          onClick={() => void browse({ ...filters, page: filters.page - 1 })}
          className="rounded-xl border p-3 disabled:opacity-40"
        >
          Previous
        </button>
        <span>Page {filters.page}</span>
        <button
          disabled={!!busy || !hasMore}
          onClick={() => void browse({ ...filters, page: filters.page + 1 })}
          className="rounded-xl border p-3 disabled:opacity-40"
        >
          Next
        </button>
      </nav>
    </main>
  );
}
