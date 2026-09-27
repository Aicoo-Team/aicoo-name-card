# Deployment, migration and acceptance

## Safety / migration

1. Back up the target database through the provider and verify the backup is
   restorable. Test on an isolated development database first.
2. Apply migrations/001_connections.sql, migrations/002_review_safety.sql, then
   migrations/003_private_archive.sql
   using the provider SQL console or psql. 002 replaces the all-status pair
   uniqueness constraint with a pending/accepted-only unique index, retaining
   terminal history. It also adds renewal lease identity/message/index fields.
   003 adds only the participant-private archived_at column on notes. All preserve
   existing name_cards/card_sessions. Tests execute
   the same SQL with PGlite. It does not prove production schema compatibility.
3. Configure the variables in .env.example securely in the correct Vercel team
   (YU CHEN's projects). Preserve the www-root OAuth redirect registration.
4. Keep AICOO_CONTACTS_ENABLED=false and do not schedule renewal until acceptance.
5. Deploy only after approval. Rollback app code if needed; retain new tables and
   exchange records. Never drop user records as part of a code rollback.

## Manual test matrix (two dedicated test users, no real customer accounts)

- OAuth: cancel/retry login, code/state mismatch, return to scanned card, expiry,
  refresh rotation, simultaneous requests, logout during refresh, revoked consent.
  Confirm the client is granted os.share:read/write and the correct API resource.
- Edit: save both cards; duplicate slug returns a helpful conflict; altered owner
  IDs and someone else's agent IDs cannot be saved. Refresh an expired session.
- Upload: signed-out, wrong Origin, SVG, fake image, oversized body, decompression
  limit, missing Blob config, daily quota, valid PNG/JPEG/WebP. Verify public Blob
  retrieval and avatar/cover preview and PNG export.
- Exchange: B scans A; no record before clicking Send. B without a saved card
  receives instructions. B sends, A sees incoming, B sees outgoing, C sees neither.
  A accepts; both see accepted. Test reject, sender cancel, double click,
  reciprocal requests, concurrent transitions and private notes.
- Exchange organization: paginate beyond 200 records; search by name/company;
  exercise all six views. Archive an accepted exchange as A; it disappears only
  from A's active views, remains visible to B, and can be restored by A. Pending
  requests must first be accepted, rejected or cancelled. Refresh with an unsaved
  note; edits remain local until saved or the page is left. Test unload warnings.
- Contacts: confirm userinfo returns a stable human username; verify
  net.contacts:manage on the actual OAuth client. Enable only in staging first.
  Test requested vs approved/already_connected, already_pending, 403, timeout and
  retry. Do not interpret a local accepted card as a confirmed Aicoo friendship.
  Clicking Connect may auto-accept a reciprocal Aicoo request under its API policy.
- Renewal: opt in with an active near-expiry test link; inspect provider expiry.
  Assert permissions/sign-in settings remain unchanged. Test revoked/expired
  links, changed binding, expired session, missing scopes, disabled preference,
  concurrent cron requests and network failure. No permanent-link guarantee.
- Devices: iPhone + Android scan/export/import, agent URL retained in Contacts,
  phone/email/website/booking links, slow/offline feedback, PNG with remote images.

## Data and operational limits

- name_cards: public fields and provider-verified human username.
- card_sessions: server-only OAuth credentials. Restrict DB access and backups;
  never return its JSON to browsers or log tokens.
- card_connections: unique live unordered account pair, requester/recipient, shared
  event label, state and timestamps. Both participants see the relationship.
- card_connection_notes: per-owner private notes, last confirmed sync status and
  reversible archived_at. Archiving is not deletion or a permission revocation.
- card_upload_quotas: database-date daily counter; attempts are reserved before
  decoding. Corrupt images and failed provider uploads consume an attempt by
  design, bounding image processing and storage retries. A dedicated retention
  job may prune old counters.
- card_renewals: opt-in agent/session binding and last status. Schedule maintenance
  frequently enough to drain batches of ten before links reach expiry.

The contacts page uses 30-row pages with one lookahead row, name/company search,
and pending/accepted/history/archived filters. Page numbers are bounded to 10,000;
offset pagination may shift while new exchanges arrive. Rejected and cancelled
relationships are retained; a user can explicitly send a new request.
Profile changes appear in existing exchange lists; immutable historical card
snapshots and account deletion/retention tooling are not part of this iteration.

Removing a Blob URL does not remove the uploaded public file. Define retention
with the owner and perform explicit, authorized cleanup of unreferenced objects.
No production data, OAuth tokens or uploaded images were used by the automated tests.

## Support and public-launch gates

- Configure a monitored SUPPORT_EMAIL before building/deploying; Help and Privacy
  are prerendered. Environment changes require a rebuild. There is deliberately
  no fabricated fallback address or public GitHub issue link for private reports.
- The data-use page describes implemented behavior, not an approved legal policy.
  The operator must approve retention, backup handling and a verified-ownership
  deletion procedure before public launch. Deletion is currently an operator-run
  request process, not an automatic account-deletion endpoint.
- Unexpected API failures return a sanitized incident reference. Server logs
  record that reference without request bodies, OAuth credentials or SQL strings.
- Client writes are never automatically retried after an ambiguous timeout.
  Users must refresh and check whether the original write succeeded.
- Do not start development and production builds against the same .next directory
  concurrently. If local file watching hits EMFILE, stop dev and smoke-test the
  completed production build with next start instead of changing global limits.

## Review revision operational notes

- Same-origin checks use the server-adapter request URL, not the build-time
  NEXT_PUBLIC_APP_URL or caller-controlled forwarded headers. Verify the deployed
  reverse proxy produces the real external origin for preview and production.
- Refresh losers poll briefly (800 ms) for the winner, then return a retryable
  503. The provider call has a 15-second timeout and a renewed 60-second lease;
  persistence is fenced by lease identity and expiry. An ambiguous DB write must
  never restore old rotating credentials. A lost provider response can still
  require re-authentication; no application can recover an unseen rotated token.
- Enabling renewal validates the binding and saves only the preference. The
  scheduler performs renewal; it is not a synchronous promise of renewal.
- Maintenance takes at most ten owners with two workers and isolates per-owner
  failures. maxDuration=300 requires a host plan that supports that duration.
  A five-minute cadence has an upper bound of 120 selected owners/hour or 1,440
  per 12-hour check window, before failures/overlap. Monitor oldest checked_at,
  selected/succeeded/outcomes and backlog; increase scheduling capacity before
  exceeding that envelope. No scheduler is enabled by this change.
- Disabling/rebinding invalidates the worker lease; stale workers cannot update
  local card metadata or status. An already sent provider PATCH cannot be recalled;
  disabling does not shorten expiry. Provider-side revocation remains authoritative.
- vCard UID/REV and booking URL are exported. Repeated-import deduplication varies
  by contact app and must be checked on actual devices; it is not guaranteed.
- The Blob SDK remains in use with an explicit token. Its OIDC/CLI/child-process
  dependency path remains a supply-chain consideration. Zero npm audit findings
  is not proof those paths are absent from the server bundle; no vendor switch
  was made as part of review fixes.
- Actions and core framework/test versions are pinned. First-workflow approval,
  required checks and branch protection are maintainer-owned. Local checks are
  not evidence that GitHub CI or Vercel preview has run successfully.
