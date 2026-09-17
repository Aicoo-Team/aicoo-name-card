# Complete Agentport exchange workflow

Goal: extend PR #1 into one reviewable implementation of reliable editing, safe
uploads, session refresh, consent-based exchange and optional Aicoo contact sync.

Constraints: no production env/DB access, no deployment, no auto-merge. Preserve
www root OAuth callback. Do not silently extend share permissions or send messages.

Modules: lib validation/http, storage + explicit SQL migration, OAuth/Aicoo client,
upload handler, connection service/routes, editor/public card/contacts UI.

Steps: add typed errors/input validation; versioned schema and atomic persistence;
OAuth refresh + scope checks; secure Blob upload; pending/accepted/rejected/cancelled
exchange state machine; personal contact notes + explicit network sync; UI/error
states; integration tests against ephemeral Postgres-compatible engine; build and
browser checks; update existing PR. Dependency updates are included and audited.

Validation: test unauthorized/cross-origin/oversize requests, duplicate slugs,
concurrent exchange requests, participant authorization, terminal-state retries,
refresh failures and scope errors. No provider credentials in tests. Run lint,
typecheck/build/audit and local UI checks. Real Blob/OAuth/mobile import remain
external acceptance gates until a test environment is provided.

Rollback: additive migration only; preserve old card/session tables and data.
Do not drop connection records to roll back app code. No automatic DDL in requests.

## Completion record (2026-09-18)

Implementation is present for all modules above, including managed image decoding,
reciprocal exchanges, gated contacts and opt-in renewal. Local tests: 12 vCard plus
39 Vitest checks (51 total); lint/types/build passed. Dependency audit is clean.
Desktop anonymous editor and unsaved-link feedback inspected. No authenticated
browser/provider/device acceptance claimed. Development credentials are still needed.
The existing non-draft PR #1 is the delivery vehicle; no production deployment.
