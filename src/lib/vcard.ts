import type { NameCard } from "@/lib/types";

function esc(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildVCard(card: NameCard) {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(card.name)}`,
    `ORG:${esc(card.company)}`,
    `TITLE:${esc(card.title)}`,
  ];

  if (card.contacts.email) lines.push(`EMAIL;TYPE=WORK:${esc(card.contacts.email)}`);
  if (card.contacts.phone) lines.push(`TEL;TYPE=CELL:${esc(card.contacts.phone)}`);
  if (card.contacts.website) lines.push(`URL:${esc(card.contacts.website)}`);
  if (card.contacts.linkedin) lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${esc(card.contacts.linkedin)}`);
  if (card.bio) lines.push(`NOTE:${esc(card.bio)}`);
  if (card.avatarUrl) lines.push(`PHOTO;VALUE=URI:${esc(card.avatarUrl)}`);

  lines.push("END:VCARD");
  return `${lines.join("\r\n")}\r\n`;
}
