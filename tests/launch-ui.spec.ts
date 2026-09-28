import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.stubGlobal("React", React);
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
import { ExchangePanel } from "../src/components/ExchangePanel";
import { CardEditor } from "../src/components/CardEditor";
import { CardPreview } from "../src/components/CardPreview";
import { Connections } from "../src/components/Connections";
import { createDefaultCard } from "../src/lib/defaults";
const render = renderToStaticMarkup;
it("keeps the scanned card target through sign-in and card creation", () => {
  const guest = render(
    React.createElement(ExchangePanel, {
      slug: "alice",
      signedIn: false,
      isOwner: false,
      hasCard: false,
    }),
  );
  expect(guest).toContain("returnTo=%2Fc%2Falice");
  const firstTime = render(
    React.createElement(ExchangePanel, {
      slug: "alice",
      signedIn: true,
      isOwner: false,
      hasCard: false,
    }),
  );
  expect(firstTime).toContain("Create my card &amp; return");
  expect(firstTime).toContain("/?returnTo=%2Fc%2Falice");
  expect(firstTime).not.toContain("Send my card &amp; request exchange");
});
it("only saved-card visitors can explicitly send a request", () => {
  const html = render(
    React.createElement(ExchangePanel, {
      slug: "alice",
      signedIn: true,
      isOwner: false,
      hasCard: true,
    }),
  );
  expect(html).toContain("Send my card &amp; request exchange");
  const owner = render(
    React.createElement(ExchangePanel, {
      slug: "alice",
      signedIn: true,
      isOwner: true,
      hasCard: true,
    }),
  );
  expect(owner).not.toContain("Send my card &amp; request exchange");
});
it("hides absent-agent actions instead of rendering a broken button", () => {
  const card = createDefaultCard("demo");
  const html = render(
    React.createElement(CardPreview, {
      card,
      publicUrl: "https://example.test/c/demo",
      hideQr: true,
    }),
  );
  expect(html).not.toContain("Talk to my agent");
  expect(html).not.toContain('href="mailto:"');
  expect(html).toContain("Save contact");
});
it("shows an unavailable message for expired agent links", () => {
  const card = {
    ...createDefaultCard("demo"),
    agent: {
      id: "x",
      label: "My agent",
      url: "https://www.aicoo.io/a/x",
      agentUrl: "",
      expiresAt: "2000-01-01",
    },
  };
  const html = render(
    React.createElement(CardPreview, {
      card,
      publicUrl: "https://example.test/c/demo",
      hideQr: true,
    }),
  );
  expect(html).toContain("unavailable or has expired");
  expect(html).not.toContain("Talk to my agent");
});
it("keeps a saved agent selectable during an upstream outage", () => {
  const card = {
    ...createDefaultCard("me"),
    agent: {
      id: "saved",
      label: "My agent",
      url: "https://www.aicoo.io/a/x",
      agentUrl: "",
    },
  };
  const html = render(
    React.createElement(CardEditor, {
      initialCard: card,
      initialSaved: true,
      user: { id: "me", name: "Me", email: "" },
      initialAgents: [],
      initialAgentError: "Temporarily unavailable",
      publicUrl: "https://example.test/c/me",
      returnTo: "/c/alice",
    }),
  );
  expect(html).toContain('value="saved" selected');
  expect(html).toContain("Save &amp; return");
});
it("does not expose disabled contact integration", () => {
  const html = render(
    React.createElement(Connections, {
      initial: [],
      error: "",
      initialHasMore: false,
      contactsEnabled: false,
    }),
  );
  expect(html).not.toContain("Connect on Aicoo");
  expect(html).toContain("Incoming requests");
  expect(html).toContain("Search by name or company");
});
