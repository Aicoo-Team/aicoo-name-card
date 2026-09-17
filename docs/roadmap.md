# Agent card delivery plan

## First PR: preserve the Agent on contact export

Bounded change: vCard serializer, regression tests, secret-free CI, and docs.
No schema change, production credentials, permission expansion, or deployment.
Rollback: revert this PR; no stored data has changed.

## Next: reliability (known handoff issues, not re-diagnosis tasks)

- Replace filesystem uploads with managed object storage; add authentication,
  size/type validation and appropriate ownership controls.
- Return a useful conflict response for a duplicate slug, including concurrent saves.
- Remove the shared API-key fallback. Verify OAuth v1 resource/scopes; implement
  token refresh and visible expired-session/error states rather than empty lists.
- Separately handle Shared Agent link expiry. Never renew explicitly revoked
  links or silently broaden scopes/login requirements.
- Define or remove the unused meeting URL behavior.
- Review existing dependency audit findings in a dedicated update.
  At initial validation, `npm audit --omit=dev` reports 5 affected packages
  (1 critical, 3 high, 1 moderate), including Next.js 16.2.10 and its image/CSS
  dependencies. This is a dependency report, not proof of an exploitable deployed
  path; assess and update before release. No automatic force-upgrade in this PR.

## Next: reciprocal exchange

Design the exchange/consent flow and a versioned migration before changing tables.
Persist both participants' relationship with idempotency, authorization, and clear
pending/accepted states. Scanning a public QR alone must not create a friendship
or grant access to private Agent context. Support users without an Agent/card.

## Next: Aicoo contacts

Verify the OAuth client's actual `net.contacts:manage` grant and API contract in a
test environment; do not equate documentation availability with granted access.
Record synchronization failures and retries separately from a successful local
exchange. Do not automatically send follow-up messages.

## Release gates

- Maintainer provides development env securely; no production DB testing.
- Tests, lint, types, build, and actual two-device exchange acceptance.
- Explicit review of migrations, consent, access scope, upload policy, and rollback.
- PR approval and a separately authorized deployment; never auto-merge.
