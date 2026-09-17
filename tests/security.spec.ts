import { it, expect, vi } from "vitest";
vi.mock("../src/lib/auth", () => ({
  getBaseUrl: () => "https://www.agentport.world",
}));
import { sameOrigin, readJson, readLimited } from "../src/lib/http";
import { safeUrl, slug, returnPath, editCard } from "../src/lib/validation";
import { imageType } from "../src/lib/uploads";
import { createDefaultCard } from "../src/lib/defaults";
it("rejects cross-site writes and absent Origin", () => {
  for (const origin of ["https://evil.example", "null", ""])
    expect(() =>
      sameOrigin(
        new Request("https://www.agentport.world/api/cards/me", {
          headers: { origin },
        }),
      ),
    ).toThrow();
  expect(() =>
    sameOrigin(
      new Request("https://www.agentport.world/api/cards/me", {
        headers: { origin: "https://www.agentport.world" },
      }),
    ),
  ).not.toThrow();
});
it("limits real streamed bytes rather than trusting content-length", async () => {
  await expect(
    readLimited(
      new Request("https://example.com", {
        method: "POST",
        body: "toolarge",
        headers: { "content-length": "1" },
      }),
      3,
    ),
  ).rejects.toMatchObject({ status: 413 });
});
it("rejects invalid JSON and MIME", async () => {
  await expect(
    readJson(
      new Request("https://example.com", {
        method: "POST",
        body: "{",
        headers: { "content-type": "application/json" },
      }),
    ),
  ).rejects.toMatchObject({ status: 400 });
  await expect(
    readJson(
      new Request("https://example.com", { method: "POST", body: "{}" }),
    ),
  ).rejects.toMatchObject({ status: 415 });
});
it("rejects unsafe URLs and redirects", () => {
  for (const url of [
    "javascript:alert(1)",
    "https://user:password@host/",
    "https://host/\r\nx",
  ])
    expect(() => safeUrl(url, "URL")).toThrow();
  expect(returnPath("//evil.example")).toBe("/");
  expect(returnPath("/c/alice")).toBe("/c/alice");
  expect(() => slug("../x")).toThrow();
});
it("ignores ownership and identity overposting", () => {
  const base = createDefaultCard("owner");
  const next = editCard(base, {
    ...base,
    ownerId: "other",
    id: "fake",
    aicooUsername: "admin",
  });
  expect(next.ownerId).toBe("owner");
  expect(next.id).toBe(base.id);
  expect(next.aicooUsername).toBeUndefined();
});
it("does not accept SVG or spoofed text as image bytes", () => {
  expect(imageType(Buffer.from("<svg onload='evil()'></svg>"))).toBeNull();
  expect(imageType(Buffer.from("a fake .png"))).toBeNull();
  expect(imageType(Buffer.from([255, 216, 255, 224]))?.mime).toBe("image/jpeg");
});
