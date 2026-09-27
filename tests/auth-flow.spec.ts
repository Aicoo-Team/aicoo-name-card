import { beforeEach, afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  jar: new Map<string, string>(),
  saveSession: vi.fn(),
  deleteSession: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (key: string) =>
      mocks.jar.has(key) ? { value: mocks.jar.get(key) } : undefined,
    delete: (key: string) => mocks.jar.delete(key),
  }),
}));
vi.mock("../src/lib/store", () => ({
  saveSession: mocks.saveSession,
  deleteSession: mocks.deleteSession,
}));
import { GET as start } from "../src/app/api/auth/aicoo/start/route";
import { GET as callback } from "../src/app/api/auth/aicoo/callback/route";
import { POST as logout } from "../src/app/api/auth/logout/route";
import {
  oauthReturnCookie,
  oauthStateCookie,
  oauthVerifierCookie,
} from "../src/lib/auth";
beforeEach(() => {
  mocks.jar.clear();
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.agentport.world");
  vi.stubEnv("AICOO_CLIENT_ID", "fixture-client");
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("preserves the target when OAuth is not configured", async () => {
  vi.stubEnv("AICOO_CLIENT_ID", "");
  const response = await start(
    new Request(
      "https://www.agentport.world/api/auth/aicoo/start?returnTo=%2Fc%2Falice",
    ),
  );
  const url = new URL(response.headers.get("location")!);
  expect(url.pathname).toBe("/auth-error");
  expect(url.searchParams.get("returnTo")).toBe("/c/alice");
  expect(url.searchParams.get("reason")).toBe("configuration");
  expect(fetch).not.toHaveBeenCalled();
});
it("sets a bounded return path and a PKCE challenge", async () => {
  const response = await start(
    new Request(
      "https://www.agentport.world/api/auth/aicoo/start?returnTo=%2Fc%2Falice",
    ),
  );
  expect(response.cookies.get(oauthReturnCookie)?.value).toBe("/c/alice");
  expect(
    new URL(response.headers.get("location")!).searchParams.get(
      "code_challenge_method",
    ),
  ).toBe("S256");
  const malicious = await start(
    new Request(
      "https://www.agentport.world/api/auth/aicoo/start?returnTo=https://evil.test",
    ),
  );
  expect(malicious.cookies.get(oauthReturnCookie)?.value).toBe("/");
});
it("cancellation returns a recoverable page without leaking OAuth details", async () => {
  mocks.jar.set(oauthReturnCookie, "/c/alice");
  const response = await callback(
    new Request(
      "https://www.agentport.world/api/auth/aicoo/callback?error=access_denied&error_description=secret",
    ),
  );
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe(
    "https://www.agentport.world/auth-error?returnTo=%2Fc%2Falice",
  );
  expect(mocks.saveSession).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});
it("successful sign-in returns to the scanned card and persists the session", async () => {
  mocks.jar.set(oauthReturnCookie, "/c/alice");
  mocks.jar.set(oauthStateCookie, "expected");
  mocks.jar.set(oauthVerifierCookie, "verifier");
  vi.mocked(fetch)
    .mockResolvedValueOnce(
      Response.json({ access_token: "test-token", expires_in: 900 }),
    )
    .mockResolvedValueOnce(Response.json({ sub: "fixture", name: "Test" }));
  const response = await callback(
    new Request(
      "https://www.agentport.world/api/auth/aicoo/callback?code=test&state=expected",
    ),
  );
  expect(response.headers.get("location")).toBe(
    "https://www.agentport.world/c/alice",
  );
  expect(mocks.saveSession).toHaveBeenCalledOnce();
});
it("rejects cross-site logout before changing any session", async () => {
  const response = await logout(
    new Request("https://www.agentport.world/api/auth/logout", {
      method: "POST",
      headers: { origin: "https://evil.test" },
    }),
  );
  expect(response.status).toBe(403);
  expect(mocks.deleteSession).not.toHaveBeenCalled();
});
