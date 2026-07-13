import { promises as fs } from "fs";
import path from "path";
import type { NameCard, StoredSession } from "@/lib/types";

type Database = {
  cards: NameCard[];
  sessions: StoredSession[];
};

const dataDir = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDir, "db.json");

async function readDb(): Promise<Database> {
  try {
    const raw = await fs.readFile(dataFile, "utf8");
    return JSON.parse(raw) as Database;
  } catch {
    return { cards: [], sessions: [] };
  }
}

async function writeDb(db: Database) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(db, null, 2));
}

export async function getCardByOwner(ownerId: string) {
  const db = await readDb();
  return db.cards.find((card) => card.ownerId === ownerId) || null;
}

export async function getCardBySlug(slug: string) {
  const db = await readDb();
  return db.cards.find((card) => card.slug === slug) || null;
}

export async function saveCard(card: NameCard) {
  const db = await readDb();
  const nextCard = { ...card, updatedAt: new Date().toISOString() };
  const existing = db.cards.findIndex((item) => item.id === card.id);

  if (existing >= 0) {
    db.cards[existing] = nextCard;
  } else {
    db.cards.push(nextCard);
  }

  await writeDb(db);
  return nextCard;
}

export async function saveSession(session: StoredSession) {
  const db = await readDb();
  const existing = db.sessions.findIndex((item) => item.id === session.id);

  if (existing >= 0) {
    db.sessions[existing] = session;
  } else {
    db.sessions.push(session);
  }

  await writeDb(db);
  return session;
}

export async function getSession(id: string | undefined) {
  if (!id) return null;
  const db = await readDb();
  return db.sessions.find((session) => session.id === id) || null;
}

export async function deleteSession(id: string | undefined) {
  if (!id) return;
  const db = await readDb();
  db.sessions = db.sessions.filter((session) => session.id !== id);
  await writeDb(db);
}
