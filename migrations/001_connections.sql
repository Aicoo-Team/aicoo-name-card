-- Apply explicitly to a backed-up development database first. No request-time DDL.
BEGIN;
CREATE TABLE IF NOT EXISTS card_sessions (
  id text PRIMARY KEY, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS name_cards (
  id text PRIMARY KEY, owner_id text NOT NULL UNIQUE, slug text NOT NULL UNIQUE,
  data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS card_connections (
  id text PRIMARY KEY,
  requester_id text NOT NULL,
  recipient_id text NOT NULL,
  pair_key text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('pending','accepted','rejected','cancelled')),
  event text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (requester_id <> recipient_id)
);
CREATE INDEX IF NOT EXISTS card_connections_requester ON card_connections(requester_id);
CREATE INDEX IF NOT EXISTS card_connections_recipient ON card_connections(recipient_id);
CREATE TABLE IF NOT EXISTS card_connection_notes (
  connection_id text NOT NULL REFERENCES card_connections(id),
  owner_id text NOT NULL,
  note text NOT NULL DEFAULT '',
  sync_status text NOT NULL DEFAULT 'not_synced',
  PRIMARY KEY(connection_id, owner_id)
);
CREATE TABLE IF NOT EXISTS card_upload_quotas (
  owner_id text NOT NULL, day date NOT NULL, count integer NOT NULL,
  PRIMARY KEY(owner_id,day)
);
CREATE TABLE IF NOT EXISTS card_renewals (
  owner_id text PRIMARY KEY, session_id text NOT NULL, agent_id text NOT NULL,
  enabled boolean NOT NULL DEFAULT false, status text NOT NULL DEFAULT 'enabled',
  checked_at timestamptz, lease_until timestamptz
);
COMMIT;
