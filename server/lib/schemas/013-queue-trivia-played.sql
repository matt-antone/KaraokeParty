-- Up
-- "There is always exactly one trivia round waiting in the queue" is the rule,
-- and this is what lets the server ask which round that is rather than infer
-- it. Play history belongs to the running player and is never persisted, so
-- without a mark here a player restart would re-ask a round the room has
-- already answered.
--
-- Separate from 012 rather than folded into it: 012 has already been applied
-- to running databases, and the migration runner keys on id — so an edited 012
-- would never run again and the column would never appear.
ALTER TABLE queue ADD COLUMN "datePlayed" integer;

-- the pending-round lookup runs on every queue change
CREATE INDEX IF NOT EXISTS idxQueueTrivia ON "queue" ("roomId" ASC, "type" ASC, "datePlayed" ASC);

-- Down
DROP INDEX IF EXISTS idxQueueTrivia;

ALTER TABLE queue DROP COLUMN "datePlayed";
