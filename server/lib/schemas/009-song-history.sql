-- Up
-- one row per user+song, keyed on the normalized artist/title like songStars so
-- it survives the scanner re-minting songIds. Replaying a song just bumps
-- dateSung; older plays of the same song aren't kept.
CREATE TABLE IF NOT EXISTS "songHistory" (
  "userId" integer NOT NULL REFERENCES users(userId) DEFERRABLE INITIALLY DEFERRED,
  "artistNorm" text NOT NULL COLLATE NOCASE,
  "titleNorm" text NOT NULL COLLATE NOCASE,
  "dateSung" integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idxUserSongHistory ON "songHistory" ("userId" ASC, "artistNorm" ASC, "titleNorm" ASC);

-- Down
DROP INDEX IF EXISTS idxUserSongHistory;

DROP TABLE songHistory;
