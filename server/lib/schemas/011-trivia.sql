-- Up
-- Questions are cached locally because a party runs on a LAN that may have no
-- internet at all, and OpenTDB allows one request per IP per five seconds — far
-- too slow to fetch a question at the moment it is needed. The server fills this
-- table in batches well ahead of use and plays out of it.
--
-- "question" is the natural key: OpenTDB has no stable id of its own, and the
-- unique index is what stops a top-up re-inserting what is already here.
CREATE TABLE IF NOT EXISTS "triviaQuestions" (
  "questionId" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "question" text NOT NULL,
  "correctAnswer" text NOT NULL,
  -- the three wrong ones, JSON. Shuffled with the right one at round time, so
  -- the answer is not always in the same place.
  "incorrectAnswers" text NOT NULL,
  "difficulty" text NOT NULL,
  "dateFetched" integer NOT NULL,
  -- null until played. Least-recently-used ordering is what lets a long party
  -- keep going after the category is exhausted instead of stopping dead.
  "dateUsed" integer
);

CREATE UNIQUE INDEX IF NOT EXISTS idxTriviaQuestion ON "triviaQuestions" ("question" ASC);
CREATE INDEX IF NOT EXISTS idxTriviaDateUsed ON "triviaQuestions" ("dateUsed" ASC);

-- One row per player per room, created on their first answer: the scoreboard
-- shows everyone who has answered at least once and nobody who has not, so
-- absence from this table *is* the "hasn't played" state.
CREATE TABLE IF NOT EXISTS "triviaScores" (
  "roomId" integer NOT NULL REFERENCES rooms(roomId) DEFERRABLE INITIALLY DEFERRED,
  "userId" integer NOT NULL REFERENCES users(userId) DEFERRABLE INITIALLY DEFERRED,
  "score" integer NOT NULL DEFAULT 0,
  "numAnswered" integer NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idxTriviaRoomUser ON "triviaScores" ("roomId" ASC, "userId" ASC);

-- Down
DROP INDEX IF EXISTS idxTriviaRoomUser;
DROP TABLE triviaScores;

DROP INDEX IF EXISTS idxTriviaDateUsed;
DROP INDEX IF EXISTS idxTriviaQuestion;
DROP TABLE triviaQuestions;
