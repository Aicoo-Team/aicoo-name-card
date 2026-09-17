# Delivery and acceptance checklist

The initial vCard-only PR has been expanded, at the user's request, into one
formal PR for the complete Agentport workflow. The production site is unchanged.

## Code delivered together

- vCard agent preservation and safe serialization
- authenticated, validated managed uploads
- card validation and slug conflict responses
- OAuth resource/scopes, refresh leases and visible errors
- opt-in expiry renewal, disabled until configured by the operator
- reciprocal request/accept/reject/cancel workflow and private notes
- explicit Aicoo contacts adapter, gated until provider permission is verified
- editor/public card/contacts UI, tests, CI, migration and operational docs

## Before merge/release

- Review consent, database migration, public upload policy and rollback.
- Authorize fork preview in YU CHEN's projects if required.
- Check actual GitHub Actions status; local passes do not imply remote passes.
- Provision isolated development Neon, Blob and OAuth configuration.
- Follow docs/operations.md and record provider + device acceptance.
- Resolve userinfo username availability and net.contacts:manage before enabling
  Aicoo contact integration. Do not use a personal API key as a workaround.
- Configure a scheduler only after renewal acceptance; monitor failed statuses.
- Obtain separate deployment approval. No auto-merge or production migration.
