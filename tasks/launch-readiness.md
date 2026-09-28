# Launch readiness — 2026-09-27

Goal: finish first-release code for the mobile web card/exchange journey.
Baseline: c8b0805; clean checkout. No commits, pushes, credentials, remote writes,
production deployment or production migration in this task. No new dependencies.

Inspect/change: src/app home/public/auth/connections routes, CardEditor,
CardPreview, ExchangePanel, Connections, lib/connections, tests, migrations,
help/privacy pages and release documentation.

Plan:
1. Preserve the target through login, first-card creation and save; handle login
   cancellation/failure with retry UI. Avoid invented default professional claims.
2. Add searchable, paginated exchange views with pending/accepted/history tabs,
   participant-private reversible archive, and safe public card DTOs.
3. Make sharing use the saved URL, native share/copy fallback, truthful absent or
   expired agent states, recoverable image/QR errors and accessible mobile controls.
4. Add help, data-use disclosure, configurable private support, error/loading/404
   UI and sanitized incident references. Do not invent legal retention promises.
5. Add SQL/route/render/helper regression tests; run all tests, lint, types, build,
   local UI smoke where available, and review diff. Record external gates.

Migration: additive 003 adds archived_at to participant-owned notes. Archive
never changes another participant's record or the shared exchange status. Pending
requests must be resolved before archive. Test 001→002→003 in disposable PGlite;
apply nowhere else. Rollback code is safe with the unused additive column retained.

Risks: OAuth/Blob/Neon/provider acceptance requires real configured services;
contact sync stays disabled by default. No automatic outreach or agent grants.
Support address, retention policy, real devices and deployment remain operator gates.
Cleanup: generated output stays ignored; leave a reviewed useful diff and update
memory/next.md + changelog.md, plus a feature-by-feature acceptance matrix.

## Completion

All five local-code steps are implemented. Added migration 003, onboarding/auth
recovery, saved-link sharing, paginated/private exchange organization and support
pages. Reviewed authentication, public DTO and private archive boundaries.
98 tests pass; typecheck, zero-warning lint and production build pass. Local
production-browser smoke completed at mobile/desktop widths. Full matrix and
external gates: docs/launch-code-acceptance.md. No commit, push or deployment.

## New formal PR handoff

The user now authorizes committing/pushing this delivery and creating a new
non-draft PR. PR #1 is still open and main contains none of its three commits.
Plan: preserve the old branch/PR; create feat/agentport-launch-readiness from the
current head; include the reviewed launch diff and its prerequisites; rerun tests,
lint, types/build and diff checks; inspect staged paths for secrets/generated
files; commit and push only the new fork branch; create a PR to upstream main.
Explain that the new PR is the consolidated review successor to #1. Do not close,
merge, deploy or migrate anything. Verify the new PR is OPEN and non-draft with
the pushed head, then record the URL and current checks in local project memory.
Only handoff docs change during this step; no additional product-code changes.
