import { afterEach, expect, it, vi } from "vitest";
import { parseExchangeFilters, exchangeQuery } from "../src/lib/exchange-view";
import { usableAgentUrl } from "../src/lib/agent-link";
import { requestJson } from "../src/lib/client-request";
import { supportEmail } from "../src/lib/support";
import { createDefaultCard } from "../src/lib/defaults";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("does not give a new user an invented professional identity", () => {
  const card = createDefaultCard("new-person");
  expect(card.title).toBe("");
  expect(card.company).toBe("");
  expect(card.bio).toBe("");
});
it("bounds filters and page numbers", () => {
  expect(parseExchangeFilters(new URLSearchParams("page=-1&view=bad"))).toEqual(
    { page: 1, view: "all", q: "" },
  );
  expect(
    parseExchangeFilters(new URLSearchParams("page=Infinity")),
  ).toHaveProperty("page", 1);
  const filters = { page: 2, q: "A & B", view: "accepted" as const };
  expect(
    parseExchangeFilters(new URLSearchParams(exchangeQuery(filters))),
  ).toEqual(filters);
  expect(
    parseExchangeFilters(new URLSearchParams({ q: "x".repeat(200) })).q,
  ).toHaveLength(120);
});
it("does not advertise expired, revoked or malformed agent links", () => {
  const agent = {
    id: "a",
    label: "Agent",
    url: "https://www.aicoo.io/a/test",
    agentUrl: "",
  };
  expect(usableAgentUrl(agent)).toBe(agent.url);
  expect(usableAgentUrl({ ...agent, agentUrl: "invalid" })).toBe(agent.url);
  expect(usableAgentUrl({ ...agent, isActive: false })).toBe("");
  expect(usableAgentUrl({ ...agent, expiresAt: "invalid" })).toBe("");
  expect(usableAgentUrl({ ...agent, expiresAt: "2000-01-01" })).toBe("");
  expect(usableAgentUrl({ ...agent, url: "javascript:alert(1)" })).toBe("");
  expect(usableAgentUrl(undefined)).toBe("");
});
it("reports network uncertainty without retrying a write", async () => {
  const fetcher = vi.fn().mockRejectedValue(new Error("timeout"));
  vi.stubGlobal("fetch", fetcher);
  await expect(
    requestJson("/api/connections", { method: "POST" }),
  ).rejects.toThrow("check whether your change was saved");
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("handles expired sessions and non-JSON gateways", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("login", { status: 401 })),
  );
  await expect(requestJson("/api/connections")).rejects.toThrow(
    "Sign in again",
  );
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("gateway", { status: 502 })),
  );
  await expect(requestJson("/api/connections")).rejects.toThrow(
    "temporarily unavailable",
  );
});
it("validates configured private support without injecting mailto parameters", () => {
  vi.stubEnv("SUPPORT_EMAIL", "support@example.test");
  expect(supportEmail()).toBe("support@example.test");
  vi.stubEnv("SUPPORT_EMAIL", "support@example.test?cc=other@example.test");
  expect(supportEmail()).toBe("");
});
