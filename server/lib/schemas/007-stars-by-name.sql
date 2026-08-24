-- Up
-- songIds are re-minted whenever the scanner re-parses a file to a different
-- artist/title, and cleanup then drops the orphaned song, so stars keyed on
-- songId don't survive a rename. Key them on the normalized artist/title
-- instead and resolve to songIds at read time.
CREATE TABLE "songStarsByName" (
  "userId" integer NOT NULL REFERENCES users(userId) DEFERRABLE INITIALLY DEFERRED,
  "artistNorm" text NOT NULL COLLATE NOCASE,
  "titleNorm" text NOT NULL COLLATE NOCASE
);

CREATE UNIQUE INDEX idxUserSongNorm ON "songStarsByName" ("userId" ASC, "artistNorm" ASC, "titleNorm" ASC);

INSERT OR IGNORE INTO "songStarsByName" ("userId", "artistNorm", "titleNorm")
  SELECT songStars.userId, artists.nameNorm, songs.titleNorm
  FROM songStars
  INNER JOIN songs USING(songId)
  INNER JOIN artists USING(artistId);

DROP TABLE "songStars";
ALTER TABLE "songStarsByName" RENAME TO "songStars";

-- Down
CREATE TABLE "songStarsById" (
  "userId" integer NOT NULL REFERENCES users(userId) DEFERRABLE INITIALLY DEFERRED,
  "songId" integer NOT NULL
);

CREATE UNIQUE INDEX idxUserSong ON "songStarsById" ("userId" ASC, "songId" ASC);

INSERT OR IGNORE INTO "songStarsById" ("userId", "songId")
  SELECT songStars.userId, songs.songId
  FROM songStars
  INNER JOIN artists ON artists.nameNorm = songStars.artistNorm
  INNER JOIN songs ON songs.artistId = artists.artistId AND songs.titleNorm = songStars.titleNorm;

DROP TABLE "songStars";
ALTER TABLE "songStarsById" RENAME TO "songStars";
