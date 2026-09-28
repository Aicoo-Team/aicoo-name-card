-- Additive; apply after 002 only with backup and release approval.
BEGIN;
ALTER TABLE card_connection_notes ADD COLUMN IF NOT EXISTS archived_at timestamptz;
COMMIT;
