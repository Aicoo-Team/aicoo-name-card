import { CardEditor } from "@/components/CardEditor";
import { createDefaultCard } from "@/lib/defaults";
import { getBaseUrl, getCurrentSession } from "@/lib/auth";
import { listSharedAgents } from "@/lib/aicoo";
import { getCardByOwner } from "@/lib/store";
import type { SharedAgent } from "@/lib/types";
import { redirect } from "next/navigation";
import { AppError } from "@/lib/errors";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: Props) {
  const query = await searchParams;
  if (query.code && query.state) {
    const params = new URLSearchParams();
    params.set("code", Array.isArray(query.code) ? query.code[0] : query.code);
    params.set(
      "state",
      Array.isArray(query.state) ? query.state[0] : query.state,
    );
    redirect(`/api/auth/aicoo/callback?${params.toString()}`);
  }

  const session = await getCurrentSession();
  const ownerId = session?.user.id || "demo";
  let card = session ? await getCardByOwner(ownerId) : null;
  const initialSaved = !!card;

  if (!card) {
    card = createDefaultCard(ownerId, {
      name: session?.user.name || "Alex Chen",
      avatarUrl: session?.user.picture || "",
      contacts: {
        email: session?.user.email || "",
        phone: "",
        linkedin: "",
        website: "",
      },
    });
  }

  let agents: SharedAgent[] = [];
  let agentError = "";
  try {
    agents = session ? await listSharedAgents(session) : [];
  } catch (error) {
    agents = [];
    agentError =
      error instanceof AppError
        ? error.message
        : "Could not load agents. Please retry.";
  }

  return (
    <CardEditor
      initialCard={card}
      initialSaved={initialSaved}
      user={session?.user || null}
      initialAgents={agents}
      initialAgentError={agentError}
      publicUrl={`${getBaseUrl()}/c/${card.slug}`}
    />
  );
}
