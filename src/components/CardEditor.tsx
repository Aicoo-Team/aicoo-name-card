"use client";

import { toPng } from "html-to-image";
import {
  Bot,
  Copy,
  Download,
  ExternalLink,
  LogIn,
  LogOut,
  Save,
} from "lucide-react";
import { useMemo, useState, ChangeEvent } from "react";
import { accentOptions } from "@/lib/defaults";
import type { NameCard, SessionUser, SharedAgent } from "@/lib/types";
import { CardPreview } from "@/components/CardPreview";
import { RenewalSettings } from "@/components/RenewalSettings";

type Props = {
  initialCard: NameCard;
  user: SessionUser | null;
  initialAgents: SharedAgent[];
  publicUrl: string;
  initialAgentError?: string;
  initialSaved: boolean;
};

export function CardEditor({
  initialCard,
  initialSaved,
  user,
  initialAgents,
  publicUrl,
  initialAgentError = "",
}: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [card, setCard] = useState(initialCard);
  const [agents, setAgents] = useState(initialAgents);
  const [agentError, setAgentError] = useState(initialAgentError);
  const [savedSlug, setSavedSlug] = useState(initialCard.slug);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  async function handleFileUpload(
    event: ChangeEvent<HTMLInputElement>,
    field: "avatarUrl" | "coverUrl",
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (field === "avatarUrl") setUploadingAvatar(true);
    else setUploadingCover(true);

    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Upload failed");
      }

      setCard((prev) => ({ ...prev, [field]: payload.url }));
      setMessage(
        `${field === "avatarUrl" ? "Avatar" : "Cover"} uploaded successfully`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      if (field === "avatarUrl") setUploadingAvatar(false);
      else setUploadingCover(false);
    }
  }

  const agentStatus = useMemo(() => {
    if (!user) return "Login with Aicoo to load your own Shared Agents.";
    if (agentError) return agentError;
    if (agents.length === 0) return "No active Shared Agents found yet.";
    return `${agents.length} Shared Agent link${agents.length === 1 ? "" : "s"} available`;
  }, [agents.length, user, agentError]);

  async function save() {
    setSaving(true);
    setMessage("");
    try {
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
      setSavedSlug(payload.card.slug);
      setSaved(true);
      setMessage("Saved");
    } catch {
      setMessage("Save failed. Check your connection and retry.");
    } finally {
      setSaving(false);
    }
  }

  async function refreshAgents() {
    setMessage("");
    try {
      const response = await fetch("/api/aicoo/share-links");
      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.error || "Could not load Shared Agents");
        setAgentError(payload.error || "Could not load Shared Agents");
        return;
      }
      setAgents(payload.agents);
      setAgentError("");
      setMessage("Shared Agents refreshed");
    } catch {
      setAgentError("Unable to load agents. Please retry.");
    }
  }

  async function copyLink() {
    if (!saved) {
      setMessage("Save your card before sharing its link.");
      return;
    }
    try {
      await navigator.clipboard.writeText(
        publicUrl.replace(/\/c\/[^/]+$/, `/c/${savedSlug}`),
      );
      setMessage(
        "Saved card link copied. Save first if you changed the address.",
      );
    } catch {
      setMessage("Unable to copy. Open the saved card and copy its address.");
    }
  }

  async function exportPng() {
    try {
      const node = document.getElementById("card-preview");
      if (!node) return;
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${card.slug || "aicoo-card"}.png`;
      link.click();
    } catch {
      setMessage(
        "PNG export failed. An external image may block export; try an uploaded image.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#15110f]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-5 md:grid-cols-[minmax(0,1fr)_430px] md:px-8 md:py-8">
        <section className="order-2 md:order-1">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-black/50">
                Aicoo card
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-normal">
                Simple agent name card
              </h1>
            </div>
            {user ? (
              <a
                className="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-black shadow-sm"
                href="/api/auth/logout"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </a>
            ) : (
              <a
                className="flex h-11 items-center gap-2 rounded-full bg-[#ff5d4f] px-4 text-sm font-black text-white shadow-sm"
                href="/api/auth/aicoo/start"
              >
                <LogIn className="h-4 w-4" />
                Login
              </a>
            )}
          </div>

          <div className="mt-5 rounded-3xl bg-white p-4 shadow-sm md:p-6">
            {user && (
              <a className="mb-4 block font-bold underline" href="/connections">
                My exchanges & contacts →
              </a>
            )}
            <p className="mb-4 text-sm text-black/60">
              Saved cards and uploaded images are public. Upload only images you
              intend to share. PNG, JPEG or WebP, up to 3 MB; 20 uploads per
              day.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Name"
                value={card.name}
                onChange={(name) => setCard({ ...card, name })}
              />
              <Field
                label="Slug"
                value={card.slug}
                onChange={(slug) => setCard({ ...card, slug })}
              />
              <Field
                label="Title"
                value={card.title}
                onChange={(title) => setCard({ ...card, title })}
              />
              <Field
                label="Company"
                value={card.company}
                onChange={(company) => setCard({ ...card, company })}
              />
              <ImageUploadField
                label="Avatar URL"
                value={card.avatarUrl}
                onChange={(avatarUrl) => setCard({ ...card, avatarUrl })}
                onUpload={(e) => handleFileUpload(e, "avatarUrl")}
                uploading={uploadingAvatar}
              />
              <ImageUploadField
                label="Cover URL"
                value={card.coverUrl}
                onChange={(coverUrl) => setCard({ ...card, coverUrl })}
                onUpload={(e) => handleFileUpload(e, "coverUrl")}
                uploading={uploadingCover}
              />
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-black/48">
                Bio
              </span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#15110f]"
                value={card.bio}
                onChange={(event) =>
                  setCard({ ...card, bio: event.target.value })
                }
              />
            </label>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                label="Email"
                value={card.contacts.email}
                onChange={(email) =>
                  setCard({ ...card, contacts: { ...card.contacts, email } })
                }
              />
              <Field
                label="Phone"
                value={card.contacts.phone}
                onChange={(phone) =>
                  setCard({ ...card, contacts: { ...card.contacts, phone } })
                }
              />
              <Field
                label="LinkedIn"
                value={card.contacts.linkedin}
                onChange={(linkedin) =>
                  setCard({ ...card, contacts: { ...card.contacts, linkedin } })
                }
              />
              <Field
                label="Website"
                value={card.contacts.website}
                onChange={(website) =>
                  setCard({ ...card, contacts: { ...card.contacts, website } })
                }
              />
              <Field
                label="Booking URL (optional)"
                value={card.meetingUrl}
                onChange={(meetingUrl) => setCard({ ...card, meetingUrl })}
              />
            </div>

            <div className="mt-5">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-black/48">
                Accent
              </p>
              <div className="mt-2 flex gap-2">
                {accentOptions.map((accent) => (
                  <button
                    key={accent}
                    aria-label={accent}
                    className={`h-9 w-9 rounded-full border-2 ${card.accent === accent ? "border-black" : "border-white"}`}
                    style={{ backgroundColor: accent }}
                    onClick={() => setCard({ ...card, accent })}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-black/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-black/48">
                    Shared Agent
                  </p>
                  <p className="mt-1 text-sm font-semibold text-black/56">
                    {agentStatus}
                  </p>
                </div>
                <button
                  className="flex h-10 items-center gap-2 rounded-full bg-[#15110f] px-4 text-sm font-black text-white disabled:opacity-40"
                  disabled={!user}
                  onClick={refreshAgents}
                >
                  <Bot className="h-4 w-4" />
                  Load
                </button>
              </div>
              <select
                className="mt-3 h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-bold outline-none"
                value={card.agent?.id || ""}
                onChange={(event) => {
                  const agent = agents.find(
                    (item) => item.id === event.target.value,
                  );
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
              {user && (
                <div className="col-span-full">
                  <RenewalSettings />
                </div>
              )}
              <button
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#ff5d4f] text-sm font-black text-white disabled:opacity-60"
                disabled={saving || !user || uploadingAvatar || uploadingCover}
                onClick={save}
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving" : "Save"}
              </button>
              <button
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#15110f] text-sm font-black text-white"
                onClick={copyLink}
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </button>
              <button
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-white text-sm font-black shadow-sm"
                onClick={exportPng}
              >
                <Download className="h-4 w-4" />
                PNG
              </button>
              <a
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-white text-sm font-black shadow-sm"
                href={saved ? `/c/${savedSlug}` : undefined}
                aria-disabled={!saved}
                target="_blank"
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </a>
            </div>
            <p
              role="status"
              className="mt-3 min-h-5 text-sm font-bold text-black/56"
            >
              {message}
            </p>
          </div>
        </section>

        <aside className="order-1 md:order-2 md:sticky md:top-6 md:self-start">
          <CardPreview
            card={card}
            exportMode={!saved}
            hideQr={!saved}
            publicUrl={publicUrl.replace(/\/c\/[^/]+$/, `/c/${card.slug}`)}
          />
        </aside>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-black/48">
        {label}
      </span>
      <input
        className="mt-2 h-12 w-full rounded-2xl border border-black/10 px-4 text-sm font-semibold outline-none focus:border-[#15110f]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ImageUploadField({
  label,
  value,
  onChange,
  onUpload,
  uploading,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
}) {
  const id = `upload-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="block">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-black/48">
        {label}
      </span>
      <div className="mt-2 flex gap-2">
        <input
          className="h-12 flex-1 min-w-0 rounded-2xl border border-black/10 px-4 text-sm font-semibold outline-none focus:border-[#15110f]"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={`Enter ${label.toLowerCase()} or upload`}
        />
        <div className="relative shrink-0">
          <button
            type="button"
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#15110f] px-4 text-sm font-black text-white hover:bg-[#ff5d4f] hover:text-white transition disabled:opacity-40"
            disabled={uploading}
            onClick={() => document.getElementById(id)?.click()}
          >
            {uploading ? "..." : "Upload"}
          </button>
          <input
            id={id}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onUpload}
          />
        </div>
      </div>
    </div>
  );
}
