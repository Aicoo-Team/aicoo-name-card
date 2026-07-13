import { promises as fs } from "fs";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import path from "path";
import type { NameCard, StoredSession } from "@/lib/types";

type Database = {
  cards: NameCard[];
  sessions: StoredSession[];
};

const dataDir = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDir, "db.json");
let sqlClient: NeonQueryFunction<false, false> | null = null;
let schemaReady = false;

function getSql() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return null;
  if (!sqlClient) sqlClient = neon(url);
  return sqlClient;
}

async function ensureSchema(sql: NeonQueryFunction<false, false>) {
  if (schemaReady) return;

  await sql`
    CREATE TABLE IF NOT EXISTS card_sessions (
      id text PRIMARY KEY,
      data jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS name_cards (
      id text PRIMARY KEY,
      owner_id text NOT NULL UNIQUE,
      slug text NOT NULL UNIQUE,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  schemaReady = true;
}

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
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    const rows = await sql`SELECT data FROM name_cards WHERE owner_id = ${ownerId} LIMIT 1`;
    return (rows[0]?.data as NameCard | undefined) || null;
  }

  const db = await readDb();
  return db.cards.find((card) => card.ownerId === ownerId) || null;
}

export async function getCardBySlug(slug: string) {
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    const rows = await sql`SELECT data FROM name_cards WHERE slug = ${slug} LIMIT 1`;
    return (rows[0]?.data as NameCard | undefined) || null;
  }

  const db = await readDb();
  return db.cards.find((card) => card.slug === slug) || null;
}

export async function saveCard(card: NameCard) {
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    const nextCard = { ...card, updatedAt: new Date().toISOString() };
    await sql`
      INSERT INTO name_cards (id, owner_id, slug, data, updated_at)
      VALUES (${nextCard.id}, ${nextCard.ownerId}, ${nextCard.slug}, ${JSON.stringify(nextCard)}::jsonb, now())
      ON CONFLICT (id) DO UPDATE SET
        owner_id = EXCLUDED.owner_id,
        slug = EXCLUDED.slug,
        data = EXCLUDED.data,
        updated_at = now()
    `;
    return nextCard;
  }

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
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    await sql`
      INSERT INTO card_sessions (id, data, created_at)
      VALUES (${session.id}, ${JSON.stringify(session)}::jsonb, now())
      ON CONFLICT (id) DO UPDATE SET
        data = EXCLUDED.data
    `;
    return session;
  }

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
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    const rows = await sql`SELECT data FROM card_sessions WHERE id = ${id} LIMIT 1`;
    return (rows[0]?.data as StoredSession | undefined) || null;
  }

  const db = await readDb();
  return db.sessions.find((session) => session.id === id) || null;
}

export async function deleteSession(id: string | undefined) {
  if (!id) return;
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    await sql`DELETE FROM card_sessions WHERE id = ${id}`;
    return;
  }

  const db = await readDb();
  db.sessions = db.sessions.filter((session) => session.id !== id);
  await writeDb(db);
}
