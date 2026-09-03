-- Up
-- The local question cache is gone: a round now fetches its five questions
-- when it starts. The cache bought instant rounds on a LAN with no internet,
-- and cost a table, a used-marker and a background top-up to keep honest. A
-- round that waits on one network call, or does not happen when the network
-- is down, is the trade taken instead.
--
-- Repeats within a night are OpenTDB's session token now, held in memory.
DROP INDEX IF EXISTS idxTriviaDateUsed;
DROP INDEX IF EXISTS idxTriviaQuestion;
DROP TABLE IF EXISTS triviaQuestions;

-- Down
CREATE TABLE IF NOT EXISTS "triviaQuestions" (
  "questionId" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "question" text NOT NULL,
  "correctAnswer" text NOT NULL,
  "incorrectAnswers" text NOT NULL,
  "difficulty" text NOT NULL,
  "dateFetched" integer NOT NULL,
  "dateUsed" integer
);
CREATE UNIQUE INDEX idxTriviaQuestion ON "triviaQuestions" ("question" ASC);
CREATE INDEX idxTriviaDateUsed ON "triviaQuestions" ("dateUsed" ASC);
