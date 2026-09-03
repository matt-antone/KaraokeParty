-- Up
-- A queue row is no longer always a singer with a song. Trivia rounds take a
-- turn in the rotation, and a round has neither — so the row gets a type, and
-- songId/userId become nullable rather than being faked with a system user and
-- a synthetic media entry.
--
-- SQLite cannot drop NOT NULL in place, so this is the standard rebuild:
-- create, copy, drop, rename. defer_foreign_keys holds prevQueueId's
-- self-reference and queuePauses' room/user references until COMMIT; the
-- migration runner has already opened a transaction around this.
PRAGMA defer_foreign_keys = ON;

CREATE TABLE "queueNew" (
  "queueId" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "roomId" integer NOT NULL REFERENCES rooms(roomId) DEFERRABLE INITIALLY DEFERRED,
  -- 'song' or 'trivia'. Defaulted so every existing row is a song and any
  -- INSERT that predates this column still works.
  "type" text NOT NULL DEFAULT 'song',
  -- both null on a trivia row: it has no singer and nothing to play
  "songId" integer,
  "userId" integer REFERENCES users(userId) DEFERRABLE INITIALLY DEFERRED,
  "prevQueueId" integer REFERENCES "queueNew"(queueId) DEFERRABLE INITIALLY DEFERRED,
  "keyChange" integer NOT NULL DEFAULT 0
);

INSERT INTO queueNew (queueId, roomId, type, songId, userId, prevQueueId, keyChange)
  SELECT queueId, roomId, 'song', songId, userId, prevQueueId, keyChange
  FROM queue;

DROP TABLE queue;

-- renaming rewrites queueNew's self-reference to the new name
ALTER TABLE "queueNew" RENAME TO "queue";

CREATE INDEX IF NOT EXISTS idxRoom ON "queue" ("roomId" ASC);
CREATE INDEX IF NOT EXISTS idxPrevQueueId ON "queue" ("prevQueueId" ASC);

-- Down
PRAGMA defer_foreign_keys = ON;

DELETE FROM queue WHERE type <> 'song';

CREATE TABLE "queueOld" (
  "queueId" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "roomId" integer NOT NULL REFERENCES rooms(roomId) DEFERRABLE INITIALLY DEFERRED,
  "songId" integer NOT NULL,
  "userId" integer NOT NULL REFERENCES users(userId) DEFERRABLE INITIALLY DEFERRED,
  "prevQueueId" integer REFERENCES "queueOld"(queueId) DEFERRABLE INITIALLY DEFERRED,
  "keyChange" integer NOT NULL DEFAULT 0
);

INSERT INTO queueOld (queueId, roomId, songId, userId, prevQueueId, keyChange)
  SELECT queueId, roomId, songId, userId, prevQueueId, keyChange
  FROM queue;

DROP TABLE queue;

ALTER TABLE "queueOld" RENAME TO "queue";

-- Removing the trivia rows leaves holes in the linked list. Rebuilding the
-- chain from queueId order is what 003 did to create it in the first place;
-- a downgrade loses hand-reordering, which beats a broken chain.
UPDATE queue
SET prevQueueId = (
  SELECT MAX(q.queueId)
  FROM queue q
  WHERE q.queueId < queue.queueId AND q.roomId = queue.roomId
);

CREATE INDEX IF NOT EXISTS idxRoom ON "queue" ("roomId" ASC);
CREATE INDEX IF NOT EXISTS idxPrevQueueId ON "queue" ("prevQueueId" ASC);
