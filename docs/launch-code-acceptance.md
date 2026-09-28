# First-release code acceptance — 2026-09-27

Scope: finish the first-release Agentport web journey on the existing checkout.
Baseline: c8b0805 on fix/preserve-agent-in-vcard. Initially validated as a local
diff; the user subsequently authorized a new formal PR on
feat/agentport-launch-readiness. It includes the unmerged prerequisites from #1
and is intended as the consolidated review successor. No deployment, production
migration or store submission is included. The old PR is not closed automatically.
Pulse, iOS, Android and other projects were not changed.

## Feature matrix

| Area | Delivered behavior | Evidence / remaining gate |
| --- | --- | --- |
| Sign-in and onboarding | Preserve scanned card through PKCE login, initial card creation and save; never auto-send an exchange | Mocked OAuth route tests and server-render tests; actual registered client still needs acceptance |
| Login recovery | Cancelled/expired/failed sign-in gets a retry page with bounded return target; missing configuration gets a help path | Auth tests and browser error-page smoke |
| Session safety | Logout is a same-origin POST; no shared API-key fallback | Route regression; token-refresh lease tests retained |
| Card editing | No invented professional defaults; save lock, size/type checks, unsaved warning, preserve stored agent selection during provider outages | Render/helper/route tests; real signed-in browser editing still required |
| Public card | Image fallback, absent/expired agent disclosure, truthful meeting CTA, mobile wrapping | Render tests; real agent access rules remain provider-owned |
| Sharing | Saved URL only; native share or clipboard fallback; QR download/retry; unsaved PNG guard | Unsaved copy guard tested in browser; native share, remote-image PNG and device downloads remain manual |
| vCard | Agent and current card URLs retained, expired/revoked links omitted, safe Unicode/text serialization | 14 Node tests; phone contact import still required |
| Exchange | Explicit request, recipient acceptance, reject/cancel, duplicate/reciprocal protection | Existing and expanded PGlite/route tests; two live users still required |
| Contacts organization | Name/company search, 30-row pages, All/Contacts/Incoming/Sent/History/Archived views | PGlite test with 205 exchanges plus API pagination tests |
| Private records | Author-only notes and archive state; archive/restore does not mutate the other participant or revoke agent access | SQL and route authorization tests; migration 003 required |
| Aicoo integration | Human-contact action stays hidden and disabled until configured; renewal remains opt-in, active-link-only | Existing provider mock tests retained; scopes/identity/scheduler acceptance required |
| Recovery and support | Loading/error/404, help/data-use pages, private support email configuration, sanitized incident references | Browser smoke, helper tests, build; operator must supply monitored address and approve policy |

## Validation

- Node 24.19.0: 14 native-runner tests passed.
- Vitest: 84 tests across 11 files passed. Total: **98 tests**, up from the
  baseline 70. PGlite executes migrations 001, 002 and 003 in disposable test DBs.
- Next route type generation and TypeScript no-emit check passed.
- ESLint src/tests passed with zero warnings; production Next build passed.
- Changed TypeScript/JSX/test files formatted; git diff whitespace check passed.
- Local production build was opened in the Codex browser at 127.0.0.1:3107.
  Home was visually checked at 390×844 and 1365×900; document width matched both
  viewport widths. Unsaved Copy Link showed its save-first warning. Help, data
  disclosure, OAuth recovery with /c/alice return target, and missing-page UI
  rendered. Captured warning/error console list was empty during this smoke.
- No live OAuth login, provider write, customer account, remote DB migration,
  real-device import, native share-sheet success or deployment claim is made.

## Rollout prerequisites

1. Maintainer review of the new consolidated PR, including the #1 prerequisites.
2. Isolated development OAuth/Neon/Blob configuration; backed-up migration
   001 → 002 → 003 before deploying the new connections query.
3. Configure SUPPORT_EMAIL before build. Approve retention, backup handling and
   ownership-verified deletion support. The included disclosure is not a legal
   policy approval or an automated deletion implementation.
4. Complete docs/operations.md with two test users and real mobile browsers.
5. Keep AICOO_CONTACTS_ENABLED=false until permission/username acceptance. Only
   enable renewal scheduling after provider verification; no perpetual-link claim.
6. Explicit deployment approval, remote CI/preview verification and rollback plan.

## Cleanup and known development limitations

The temporary local servers were stopped; the responsive viewport override was
reset and the successful smoke tab closed. The first failed-load tab could not
be explicitly closed because the browser blocked its generated data URL; it was
not marked to persist. No credentials or production records were loaded.

The default shell had no npm executable, so checks used the bundled Node runtime
and installed local CLI entrypoints (equivalent to package scripts). Formatting
used the already-installed Prettier CLI from the adjacent Pulse dependency tree;
no Pulse files or dependencies were modified. No dependencies were installed.

The dev server hit EMFILE watcher errors. It was stopped and replaced by a
production-build smoke, without changing global file limits or deleting source.
Build output, local memory and disposable tmp remain ignored; none belongs in Git.

Automatic outreach/matching, community, full CRM and a new native app remain out
of this first-release scope. Saving a phone contact is not a bilateral exchange,
and an accepted exchange is not an Aicoo permission grant.
