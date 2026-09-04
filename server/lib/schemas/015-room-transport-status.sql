-- Up
-- A room's status becomes its transport: play, paused or stopped. It already
-- decided who could get in, which is most of what pausing means, so this is a
-- rename of the same column rather than a second gate beside it.
--
-- open -> play, and closed -> stopped: a closed room was one nobody could join
-- and nothing was going to be sung in, which is what stopped means. Nothing is
-- emptied here — stop only clears a room when an admin presses it, and an
-- upgrade is not an admin pressing it.
UPDATE rooms SET status = 'play' WHERE status = 'open';
UPDATE rooms SET status = 'stopped' WHERE status = 'closed';

-- Down
-- paused has no pre-transport equivalent; a paused room was not accepting
-- singers, so it goes back as closed alongside the stopped ones.
UPDATE rooms SET status = 'open' WHERE status = 'play';
UPDATE rooms SET status = 'closed' WHERE status IN ('paused', 'stopped');
