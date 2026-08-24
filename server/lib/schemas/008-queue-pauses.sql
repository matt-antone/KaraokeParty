-- Up
CREATE TABLE IF NOT EXISTS "queuePauses" (
  "roomId" integer NOT NULL REFERENCES rooms(roomId) DEFERRABLE INITIALLY DEFERRED,
  "userId" integer NOT NULL REFERENCES users(userId) DEFERRABLE INITIALLY DEFERRED
);

CREATE UNIQUE INDEX IF NOT EXISTS idxRoomUserPause ON "queuePauses" ("roomId" ASC, "userId" ASC);

-- Down
DROP INDEX IF EXISTS idxRoomUserPause;

DROP TABLE queuePauses;
