import type { NameCard } from "@/lib/types";

export const accentOptions = ["#ff5d4f", "#6bbde3", "#15110f", "#8d8050", "#58c76f"];

export function createDefaultCard(ownerId: string, input?: Partial<NameCard>): NameCard {
  const now = new Date().toISOString();
  const name = input?.name || "Your Name";

  return {
    id: input?.id || crypto.randomUUID(),
    ownerId,
    slug: input?.slug || makeSlug(name),
    name,
    title: input?.title || "Founder",
    company: input?.company || "Aicoo",
    bio: input?.bio || "A short note about what you do and how your Aicoo agent can help.",
    avatarUrl: input?.avatarUrl || "",
    coverUrl: input?.coverUrl || "",
    accent: input?.accent || accentOptions[0],
    contacts: {
      email: input?.contacts?.email || "",
      phone: input?.contacts?.phone || "",
      linkedin: input?.contacts?.linkedin || "",
      website: input?.contacts?.website || "",
    },
    meetingUrl: input?.meetingUrl || "",
    agent: input?.agent,
    updatedAt: now,
  };
}

export function makeSlug(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);

  return base || `card-${crypto.randomUUID().slice(0, 8)}`;
}
