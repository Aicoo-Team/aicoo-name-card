import { CardEditor } from "@/components/CardEditor";
import { createDefaultCard } from "@/lib/defaults";
import { getBaseUrl, getCurrentSession } from "@/lib/auth";
import { listSharedAgents } from "@/lib/aicoo";
import { getCardByOwner, saveCard } from "@/lib/store";
import type { SharedAgent } from "@/lib/types";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: Props) {
  const query = await searchParams;
  if (query.code && query.state) {
    const params = new URLSearchParams();
    params.set("code", Array.isArray(query.code) ? query.code[0] : query.code);
    params.set("state", Array.isArray(query.state) ? query.state[0] : query.state);
    redirect(`/api/auth/aicoo/callback?${params.toString()}`);
  }

  const session = await getCurrentSession();
  const ownerId = session?.user.id || "demo";
  let card = await getCardByOwner(ownerId);

  if (!card) {
    card = createDefaultCard(ownerId, {
      name: session?.user.name || "Alex Chen",
      avatarUrl: session?.user.picture || "",
      contacts: { email: session?.user.email || "", phone: "", linkedin: "", website: "" },
    });
    card = await saveCard(card);
  }

  let agents: SharedAgent[] = [];
  try {
    agents = session ? await listSharedAgents(session) : [];
  } catch {
    agents = [];
  }

  return <CardEditor initialCard={card} user={session?.user || null} initialAgents={agents} publicUrl={`${getBaseUrl()}/c/${card.slug}`} />;
}
