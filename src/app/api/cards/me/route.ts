import { NextResponse } from "next/server";
import { createDefaultCard } from "@/lib/defaults";
import { getCurrentSession } from "@/lib/auth";
import { getCardByOwner, saveCard } from "@/lib/store";
import type { NameCard } from "@/lib/types";

export async function PUT(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Login with Aicoo before editing your card." }, { status: 401 });
  }

  const body = (await request.json()) as Partial<NameCard>;
  const existing = await getCardByOwner(session.user.id);
  const base = existing || createDefaultCard(session.user.id);
  const card: NameCard = {
    ...base,
    ...body,
    id: base.id,
    ownerId: session.user.id,
    contacts: {
      ...base.contacts,
      ...body.contacts,
    },
  };

  const saved = await saveCard(card);
  return NextResponse.json({ card: saved });
}
