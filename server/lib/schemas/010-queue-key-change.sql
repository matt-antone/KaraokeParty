-- Up
-- Semitones to shift the song when it plays, stored on the queue entry rather
-- than the song: the same track needs a different key for each singer. 0 is
-- the recording's own key, and the column is clamped to KEY_CHANGE_MAX either
-- side in shared/types.ts, not here, so the bound is one number to change.
ALTER TABLE queue ADD COLUMN "keyChange" integer NOT NULL DEFAULT 0;

-- Down
ALTER TABLE queue DROP COLUMN "keyChange";
