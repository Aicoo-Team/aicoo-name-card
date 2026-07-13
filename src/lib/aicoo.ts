import type { SharedAgent, StoredSession } from "@/lib/types";

const aicooBaseUrl = "https://www.aicoo.io";

type AicooShareLink = {
  id?: string;
  token?: string;
  label?: string;
  url?: string;
  agentUrl?: string;
  isActive?: boolean;
};

function getServerBearer(session: StoredSession | null) {
  return session?.accessToken || process.env.AICOO_API_KEY || "";
}

export async function listSharedAgents(session: StoredSession | null): Promise<SharedAgent[]> {
  const bearer = getServerBearer(session);
  if (!bearer) return [];

  const response = await fetch(`${aicooBaseUrl}/api/v1/os/share/list?status=active&limit=50`, {
    headers: { Authorization: `Bearer ${bearer}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Aicoo share list failed: ${response.status}`);
  }

  const payload = await response.json();
  const links: AicooShareLink[] = Array.isArray(payload.links) ? payload.links : [];

  return links
    .filter((link) => link?.url || link?.agentUrl)
    .map((link) => ({
      id: String(link.id || link.token || link.url),
      label: String(link.label || "Aicoo Shared Agent"),
      url: String(link.url || link.agentUrl),
      agentUrl: String(link.agentUrl || link.url),
      isActive: Boolean(link.isActive ?? true),
    }));
}
