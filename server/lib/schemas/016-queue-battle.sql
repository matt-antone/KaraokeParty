-- Up
-- A battle is one turn sung by two people, so the row needs a second singer
-- and a second song. It reuses the existing columns for the challenger --
-- userId is who called the battle out, songId is what they sing -- so every
-- consumer that already reads a queue row as "this person, this song" keeps
-- working and merely under-reports a battle rather than breaking on it.
--
-- Note which song sits where: a fighter never picks their own. songId is the
-- challenger's song and the opponent chose it; opponentSongId is the
-- opponent's and the challenger chose it. Filing each song under the person
-- who has to sing it, rather than under whoever picked it, is what keeps
-- "userId sings songId" true for the challenger.
--
-- No REFERENCES on either column, matching songId, which lost its own in 012's
-- rebuild. A foreign key on opponentUserId would turn User.remove's
-- "DELETE FROM queue WHERE userId = ?" into a hard failure whenever the person
-- being removed is somebody else's opponent -- an admin unable to delete a
-- guest, with nothing on screen saying why. User.remove clears those rows
-- instead.
--
-- A plain column add rather than 012's create/copy/drop/rename because nothing
-- here needs an existing NOT NULL relaxed: 012 already made songId and userId
-- nullable, and SQLite adds a nullable column in place.
ALTER TABLE queue ADD COLUMN "opponentUserId" integer;
ALTER TABLE queue ADD COLUMN "opponentSongId" integer;

-- Down
-- Rows first, columns second: a battle stripped of its second half is not a
-- turn anybody can sing, and the player would stand on it waiting for a song
-- that is no longer recorded anywhere.
DELETE FROM queue WHERE "type" = 'battle';

-- and the holes those rows leave in the linked list are closed the way 012's
-- own downgrade closes them: rebuild the chain from queueId order. Losing a
-- hand-reordered queue beats leaving prevQueueId pointing at a deleted row,
-- which Queue.get walks straight into.
UPDATE queue
SET prevQueueId = (
  SELECT MAX(q.queueId)
  FROM queue q
  WHERE q.queueId < queue.queueId AND q.roomId = queue.roomId
);

ALTER TABLE queue DROP COLUMN "opponentSongId";

ALTER TABLE queue DROP COLUMN "opponentUserId";
