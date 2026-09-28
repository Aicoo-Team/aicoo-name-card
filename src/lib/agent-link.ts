import type { SharedAgent } from "./types";

export function usableAgentUrl(
  agent: SharedAgent | undefined,
  now = Date.now(),
) {
  if (!agent || agent.isActive === false) return "";
  if (
    agent.expiresAt &&
    (!Number.isFinite(Date.parse(agent.expiresAt)) ||
      Date.parse(agent.expiresAt) <= now)
  )
    return "";
  for (const raw of [agent.agentUrl, agent.url]) {
    if (!raw || /[\r\n]/.test(raw)) continue;
    try {
      const url = new URL(raw);
      if (url.protocol !== "https:" || url.username || url.password) continue;
      return url.href;
    } catch {
      /* Try the share URL if the preferred URL is invalid. */
    }
  }
  return "";
}
