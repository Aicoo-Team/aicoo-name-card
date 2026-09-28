import assert from "node:assert/strict";
import { test } from "node:test";
import { buildVCard } from "../src/lib/vcard.ts";

function card(overrides = {}) {
  return {
    id: "fixture", ownerId: "fixture-owner", slug: "example-person",
    name: "Example Person", title: "Engineer", company: "Example",
    bio: "Builds useful things", avatarUrl: "", coverUrl: "", accent: "#000000",
    contacts: { email: "person@example.com", phone: "+123456789", website: "https://example.com/", linkedin: "" },
    meetingUrl: "", updatedAt: "2026-09-17T00:00:00Z",
    ...overrides,
  };
}

const agent = { id: "example", label: "Assistant", agentUrl: "https://www.aicoo.io/a/example", url: "https://www.aicoo.io/a/fallback" };
const unfold = (value) => value.replace(/\r\n[ \t]/g, "");

test("keeps existing contact fields without adding an agent to ordinary cards", () => {
  const output = unfold(buildVCard(card()));
  for (const line of ["VERSION:3.0", "FN:Example Person", "N:;Example Person;;;", "ORG:Example", "TITLE:Engineer", "EMAIL;TYPE=WORK:person@example.com", "TEL;TYPE=CELL:+123456789", "URL:https://example.com/", "NOTE:Builds useful things"]) {
    assert.ok(output.split("\r\n").includes(line), line);
  }
  assert.ok(!output.includes("item1."));
  assert.ok(!output.includes("Aicoo agent"));
});

test("preserves both the website and preferred agent URL, with a readable note fallback", () => {
  const output = unfold(buildVCard(card({ agent })));
  assert.ok(output.includes("URL:https://example.com/\r\n"));
  assert.ok(output.includes(`item1.URL:${agent.agentUrl}\r\nitem1.X-ABLabel:Aicoo Agent`));
  assert.ok(output.includes(`NOTE:Builds useful things\\n\\nTalk to my Aicoo agent: ${agent.agentUrl}`));
  assert.ok(!output.includes(agent.url));
});

test("uses the share URL when agentUrl is missing", () => {
  const output = unfold(buildVCard(card({ agent: { ...agent, agentUrl: "" }, bio: "" })));
  assert.ok(output.includes(`item1.URL:${agent.url}`));
  assert.ok(output.includes(`NOTE:Talk to my Aicoo agent: ${agent.url}`));
});

test("does not export an explicitly inactive agent", () => {
  const output = buildVCard(card({ agent: { ...agent, isActive: false } }));
  assert.ok(!output.includes("item1."));
  assert.ok(!output.includes("aicoo.io"));
});

for (const url of ["javascript:alert(1)", "not a URL", "https://user:password@example.com/", "https://example.com/\r\nTEL:injected"]) {
  test(`rejects unsafe or invalid agent URL: ${JSON.stringify(url)}`, () => {
    const output = buildVCard(card({ agent: { ...agent, agentUrl: url, url } }));
    assert.ok(!output.includes("item1."));
    assert.ok(!output.includes("TEL:injected"));
  });
}

test("falls back to a valid share URL when the preferred URL is invalid", () => {
  assert.ok(unfold(buildVCard(card({ agent: { ...agent, agentUrl: "invalid" } }))).includes(`item1.URL:${agent.url}`));
});

test("escapes text, normalizes CR/LF, and prevents extra vCard properties", () => {
  const output = unfold(buildVCard(card({ name: "A,B;C\\D\r\nEND:VCARD", bio: "one\rtwo\nthree" })));
  assert.ok(output.includes("FN:A\\,B\\;C\\\\D\\nEND:VCARD\r\n"));
  assert.ok(output.includes("NOTE:one\\ntwo\\nthree\r\n"));
  assert.equal(output.split("\r\n").filter((line) => line === "END:VCARD").length, 1);
});

test("keeps URI punctuation while escaping the note representation", () => {
  const url = "https://www.aicoo.io/a/example?x=a,b;c&y=1";
  const output = unfold(buildVCard(card({ agent: { ...agent, agentUrl: url } })));
  assert.ok(output.includes(`item1.URL:${url}\r\n`));
  assert.ok(output.includes("x=a\\,b\\;c&y=1"));
});

test("folds long Unicode lines at 75 bytes and unfolds without corruption", () => {
  const name = "名片🤝".repeat(40);
  const output = buildVCard(card({ name, agent }));
  for (const line of output.split("\r\n")) assert.ok(Buffer.byteLength(line) <= 75);
  assert.ok(unfold(output).includes(`FN:${name}\r\n`));
  assert.ok(!output.includes("\ufffd"));
  assert.ok(output.endsWith("END:VCARD\r\n"));
  assert.ok(!output.replace(/\r\n/g, "").includes("\n"));
});
