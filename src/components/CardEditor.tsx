"use client";

import { toPng } from "html-to-image";
import { Bot, Copy, Download, ExternalLink, LogIn, LogOut, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { accentOptions } from "@/lib/defaults";
import type { NameCard, SessionUser, SharedAgent } from "@/lib/types";
import { CardPreview } from "@/components/CardPreview";

type Props = {
  initialCard: NameCard;
  user: SessionUser | null;
  initialAgents: SharedAgent[];
  publicUrl: string;
};

export function CardEditor({ initialCard, user, initialAgents, publicUrl }: Props) {
  const [card, setCard] = useState(initialCard);
  const [agents, setAgents] = useState(initialAgents);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const agentStatus = useMemo(() => {
    if (!user) return "Login with Aicoo to load your own Shared Agents.";
    if (agents.length === 0) return "No active Shared Agents found yet.";
    return `${agents.length} Shared Agent link${agents.length === 1 ? "" : "s"} available`;
  }, [agents.length, user]);

  async function save() {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/cards/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card),
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(payload.error || "Save failed");
      return;
    }
    setCard(payload.card);
    setMessage("Saved");
  }

  async function refreshAgents() {
    setMessage("");
    const response = await fetch("/api/aicoo/share-links");
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error || "Could not load Shared Agents");
      return;
    }
    setAgents(payload.agents);
    setMessage("Shared Agents refreshed");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    setMessage("Link copied");
  }

  async function exportPng() {
    const node = document.getElementById("card-preview");
    if (!node) return;
    const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${card.slug || "aicoo-card"}.png`;
    link.click();
  }

  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#15110f]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-5 md:grid-cols-[minmax(0,1fr)_430px] md:px-8 md:py-8">
        <section className="order-2 md:order-1">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-black/50">Aicoo card</p>
              <h1 className="mt-1 text-3xl font-black tracking-normal">Simple agent name card</h1>
            </div>
            {user ? (
              <a className="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-black shadow-sm" href="/api/auth/logout">
                <LogOut className="h-4 w-4" />
                Logout
              </a>
            ) : (
              <a className="flex h-11 items-center gap-2 rounded-full bg-[#ff5d4f] px-4 text-sm font-black text-white shadow-sm" href="/api/auth/aicoo/start">
                <LogIn className="h-4 w-4" />
                Login
              </a>
            )}
          </div>

          <div className="mt-5 rounded-3xl bg-white p-4 shadow-sm md:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={card.name} onChange={(name) => setCard({ ...card, name })} />
              <Field label="Slug" value={card.slug} onChange={(slug) => setCard({ ...card, slug })} />
              <Field label="Title" value={card.title} onChange={(title) => setCard({ ...card, title })} />
              <Field label="Company" value={card.company} onChange={(company) => setCard({ ...card, company })} />
              <Field label="Avatar URL" value={card.avatarUrl} onChange={(avatarUrl) => setCard({ ...card, avatarUrl })} />
              <Field label="Cover URL" value={card.coverUrl} onChange={(coverUrl) => setCard({ ...card, coverUrl })} />
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-black/48">Bio</span>
              <textarea className="mt-2 min-h-24 w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#15110f]" value={card.bio} onChange={(event) => setCard({ ...card, bio: event.target.value })} />
            </label>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Email" value={card.contacts.email} onChange={(email) => setCard({ ...card, contacts: { ...card.contacts, email } })} />
              <Field label="Phone" value={card.contacts.phone} onChange={(phone) => setCard({ ...card, contacts: { ...card.contacts, phone } })} />
              <Field label="LinkedIn" value={card.contacts.linkedin} onChange={(linkedin) => setCard({ ...card, contacts: { ...card.contacts, linkedin } })} />
              <Field label="Website" value={card.contacts.website} onChange={(website) => setCard({ ...card, contacts: { ...card.contacts, website } })} />
              <Field label="Meeting URL" value={card.meetingUrl} onChange={(meetingUrl) => setCard({ ...card, meetingUrl })} />
            </div>

            <div className="mt-5">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-black/48">Accent</p>
              <div className="mt-2 flex gap-2">
                {accentOptions.map((accent) => (
                  <button key={accent} aria-label={accent} className={`h-9 w-9 rounded-full border-2 ${card.accent === accent ? "border-black" : "border-white"}`} style={{ backgroundColor: accent }} onClick={() => setCard({ ...card, accent })} />
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-black/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-black/48">Shared Agent</p>
                  <p className="mt-1 text-sm font-semibold text-black/56">{agentStatus}</p>
                </div>
                <button className="flex h-10 items-center gap-2 rounded-full bg-[#15110f] px-4 text-sm font-black text-white disabled:opacity-40" disabled={!user} onClick={refreshAgents}>
                  <Bot className="h-4 w-4" />
                  Load
                </button>
              </div>
              <select
                className="mt-3 h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-bold outline-none"
                value={card.agent?.id || ""}
                onChange={(event) => {
                  const agent = agents.find((item) => item.id === event.target.value);
                  setCard({ ...card, agent });
                }}
              >
                <option value="">Choose a Shared Agent</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <button className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#ff5d4f] text-sm font-black text-white disabled:opacity-60" disabled={saving} onClick={save}>
                <Save className="h-4 w-4" />
                {saving ? "Saving" : "Save"}
              </button>
              <button className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#15110f] text-sm font-black text-white" onClick={copyLink}>
                <Copy className="h-4 w-4" />
                Copy Link
              </button>
              <button className="flex h-12 items-center justify-center gap-2 rounded-full bg-white text-sm font-black shadow-sm" onClick={exportPng}>
                <Download className="h-4 w-4" />
                PNG
              </button>
              <a className="flex h-12 items-center justify-center gap-2 rounded-full bg-white text-sm font-black shadow-sm" href={`/c/${card.slug}`} target="_blank">
                <ExternalLink className="h-4 w-4" />
                Open
              </a>
            </div>
            <p className="mt-3 min-h-5 text-sm font-bold text-black/56">{message}</p>
          </div>
        </section>

        <aside className="order-1 md:order-2 md:sticky md:top-6 md:self-start">
          <CardPreview card={card} publicUrl={publicUrl.replace(/\/c\/[^/]+$/, `/c/${card.slug}`)} />
        </aside>
      </div>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-black/48">{label}</span>
      <input className="mt-2 h-12 w-full rounded-2xl border border-black/10 px-4 text-sm font-semibold outline-none focus:border-[#15110f]" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
