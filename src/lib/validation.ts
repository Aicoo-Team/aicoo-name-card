import { AppError } from "./errors";
import type { NameCard } from "./types";

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new AppError("Invalid request.");
  return value as Record<string, unknown>;
}
export function text(
  value: unknown,
  label: string,
  max: number,
  required = false,
) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
  )
    throw new AppError(`Invalid ${label}.`);
  const result = value.trim();
  if (required && !result) throw new AppError(`${label} is required.`);
  return result;
}
export function safeUrl(value: unknown, label: string) {
  const raw = text(value ?? "", label, 2048);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (
      !/^https?:$/.test(url.protocol) ||
      url.username ||
      url.password ||
      /[\r\n]/.test(raw)
    )
      throw new Error();
    return url.href;
  } catch {
    throw new AppError(`${label} must be an HTTP(S) URL without credentials.`);
  }
}
export function slug(value: unknown) {
  const result = text(value, "Card address", 64, true);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result))
    throw new AppError(
      "Card address must use lowercase letters, numbers and single hyphens.",
    );
  return result;
}
export function editCard(base: NameCard, value: unknown): NameCard {
  const body = record(value),
    contacts = record(body.contacts);
  const email = text(contacts.email, "email", 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new AppError("Invalid email.");
  const accent = text(body.accent, "accent", 7);
  if (!/^#[0-9a-f]{6}$/i.test(accent))
    throw new AppError("Invalid accent color.");
  return {
    ...base,
    slug: slug(body.slug),
    name: text(body.name, "Name", 120, true),
    title: text(body.title, "title", 160),
    company: text(body.company, "company", 160),
    bio: text(body.bio, "bio", 2000),
    avatarUrl: safeUrl(body.avatarUrl, "Avatar"),
    coverUrl: safeUrl(body.coverUrl, "Cover"),
    meetingUrl: safeUrl(body.meetingUrl, "Booking link"),
    accent,
    contacts: {
      email,
      phone: text(contacts.phone, "phone", 64),
      website: safeUrl(contacts.website, "Website"),
      linkedin: safeUrl(contacts.linkedin, "LinkedIn"),
    },
  };
}

export function returnPath(value: string | null) {
  return value && /^\/(?:c\/[a-z0-9-]+|connections)$/.test(value) ? value : "/";
}
