import path from 'path'
import { db } from '../lib/Database.js'
import sql from 'sqlate'
import { clampKeyChange, QueueItem } from '../../shared/types.js'

class Queue {
  /**
   * Add a songId to a room's queue
   */
  static add ({ roomId, songId, userId }: { roomId: number, songId: number, userId: number }): void {
    const fields = new Map()
    fields.set('roomId', roomId)
    fields.set('songId', songId)
    fields.set('userId', userId)
    // Siglos's behaviour: a returning singer gets the key they last used for
    // this song rather than the recording's. Nothing to remember on a first
    // request, and the DEFAULT 0 covers that.
    //
    // ponytail: matched on songId, so a scanner rescan that re-mints ids
    // forgets the key. That degrades to the original key, which is safe; if it
    // ever matters, match on the normalized artist/title the way songStars and
    // songHistory already do.
    fields.set('keyChange', sql`COALESCE((
      SELECT keyChange
      FROM queue
      WHERE userId = ${userId} AND songId = ${songId}
      ORDER BY queueId DESC
      LIMIT 1
    ), 0)`)
    fields.set('prevQueueId', sql`(
      SELECT queueId
      FROM queue
      WHERE roomId = ${roomId} AND queueId NOT IN (
        SELECT prevQueueId
        FROM queue
        WHERE prevQueueId IS NOT NULL
      )
    )`)

    const query = sql`
      INSERT INTO queue ${sql.tuple(Array.from(fields.keys()).map(sql.column))}
      VALUES ${sql.tuple(Array.from(fields.values()))}
    `
    const res = db.run(String(query), query.parameters)

    if (res.changes !== 1) {
      throw new Error('Could not add song to queue')
    }
  }

  /**
   * Append a trivia round to a room's queue, unless one is already waiting.
   *
   * Idempotent by design: "there is always exactly one round in the queue" is
   * the rule, and two clients whose actions race must not both append one.
   * The pending round is a real row, so the check is a query rather than a
   * lock — SQLite serialises the writes and the loser sees the winner's row.
   *
   * Returns the queueId of the pending round, new or already there.
   */
  static addTrivia (roomId: number): number {
    const pending = this.getPendingTriviaId(roomId)
    if (pending !== null) return pending

    const query = sql`
      INSERT INTO queue (roomId, type, prevQueueId)
      VALUES (${roomId}, 'trivia', (
        SELECT queueId
        FROM queue
        WHERE roomId = ${roomId} AND queueId NOT IN (
          SELECT prevQueueId
          FROM queue
          WHERE prevQueueId IS NOT NULL
        )
      ))
    `
    const res = db.run(String(query), query.parameters)

    if (res.changes !== 1) throw new Error('Could not add a trivia round to the queue')

    return res.lastID
  }

  /** The round waiting to be asked in this room, or null. */
  static getPendingTriviaId (roomId: number): number | null {
    const query = sql`
      SELECT queueId
      FROM queue
      WHERE roomId = ${roomId} AND type = 'trivia' AND datePlayed IS NULL
      ORDER BY queueId ASC
      LIMIT 1
    `
    return db.get<{ queueId: number }>(String(query), query.parameters)?.queueId ?? null
  }

  /** Mark a round asked, so a player restart does not ask it again. */
  static setTriviaPlayed (queueId: number): void {
    const query = sql`
      UPDATE queue
      SET datePlayed = ${Date.now()}
      WHERE queueId = ${queueId} AND type = 'trivia'
    `
    db.run(String(query), query.parameters)
  }

  /**
   * Drop every round that has not been asked yet — trivia was switched off.
   * Rounds already played stay: they are part of what the room did tonight.
   */
  static removePendingTrivia (roomId: number): void {
    const query = sql`
      SELECT queueId
      FROM queue
      WHERE roomId = ${roomId} AND type = 'trivia' AND datePlayed IS NULL
    `
    for (const row of db.all<{ queueId: number }>(String(query), query.parameters)) {
      this.remove(row.queueId)
    }
  }

  /**
   * Get queued items for a given room
   */
  static get (roomId: number): { result: number[], entities: Record<number, QueueItem>, pausedUserIds: number[] } {
    const result: number[] = []
    const entities: Record<number, any> = {}
    const map = new Map()
    const pathData = new Map()
    let curQueueId = null

    // LEFT joins because a trivia round has no singer, no song and no media.
    // The INNER joins used to double as a filter — a song whose media has gone
    // is not playable and must not appear — so that filter is now written out
    // in the WHERE clause rather than lost.
    const query = sql`
      SELECT queueId, type, songId, userId, prevQueueId, keyChange, datePlayed,
        media.mediaId, media.relPath, media.rgTrackGain, media.rgTrackPeak,
        users.name AS userDisplayName, users.dateUpdated AS userDateUpdated,
        paths.pathId, paths.data AS pathData,
        MAX(isPreferred) AS isPreferred
      FROM queue
        LEFT JOIN users USING(userId)
        LEFT JOIN media USING(songId)
        LEFT JOIN paths USING(pathId)
      WHERE roomId = ${roomId}
        AND (queue.type <> 'song' OR media.mediaId IS NOT NULL)
      GROUP BY queueId
      ORDER BY queueId, paths.priority ASC
    `
    const rows = db.all<{
      queueId: number
      type: 'song' | 'trivia'
      datePlayed: number | null
      songId: number | null
      userId: number | null
      prevQueueId: number
      keyChange: number
      mediaId: number
      relPath: string
      rgTrackGain: number
      rgTrackPeak: number
      userDisplayName: string
      userDateUpdated: number
      pathId: number
      pathData: string
      isPreferred: number
    }>(String(query), query.parameters)

    for (const row of rows) {
      if (!pathData.has(row.pathId)) {
        pathData.set(row.pathId, JSON.parse(row.pathData))
      }

      const pathPrefs = pathData.get(row.pathId)?.prefs

      entities[row.queueId] = row
      entities[row.queueId].mediaType = row.type === 'song' ? this.getType(row.relPath) : null
      entities[row.queueId].isVideoKeyingEnabled = !!pathPrefs?.isVideoKeyingEnabled

      // a round has no singer and no song; 0 keeps every consumer that filters
      // by userId or looks a song up by songId working without a null check
      entities[row.queueId].songId = row.songId ?? 0
      entities[row.queueId].userId = row.userId ?? 0

      // The player names whoever is up next during the intermission, in the
      // corner panel and in the coming-up line. A round is up next like anyone
      // else, so it is given a name here rather than teaching each of those
      // three places what an absent singer looks like.
      if (row.type === 'trivia') {
        entities[row.queueId].userDisplayName = 'Trivia'
        entities[row.queueId].isPlayed = row.datePlayed !== null
      }

      delete entities[row.queueId].datePlayed

      // don't send over the wire
      delete entities[row.queueId].relPath
      delete entities[row.queueId].isPreferred
      delete entities[row.queueId].pathData

      if (row.prevQueueId === null) {
        // found the first item
        result.push(row.queueId)
        curQueueId = row.queueId
      } else {
        // map indexed by prevQueueId
        map.set(row.prevQueueId, row.queueId)
      }
    }

    while (result.length < rows.length) {
      // get the item whose prevQueueId references the current one
      const nextQueueId = entities[map.get(curQueueId)].queueId
      result.push(nextQueueId)
      curQueueId = nextQueueId
    }

    return { result, entities, pausedUserIds: this.getPausedUserIds(roomId) }
  }

  /**
   * Set the key a queue item plays in, in semitones from the recording
   */
  static setKeyChange ({ keyChange, queueId }: { keyChange: number, queueId: number }): void {
    const query = sql`
      UPDATE queue
      SET keyChange = ${clampKeyChange(keyChange)}
      WHERE queueId = ${queueId}
    `
    const res = db.run(String(query), query.parameters)

    if (res.changes !== 1) {
      throw new Error(`Could not set key for queueId: ${queueId}`)
    }
  }

  /**
   * Get userIds whose songs are paused (sitting out) in a given room
   */
  static getPausedUserIds (roomId: number): number[] {
    const query = sql`
      SELECT userId
      FROM queuePauses
      WHERE roomId = ${roomId}
    `
    return db.all<{ userId: number }>(String(query), query.parameters).map(row => row.userId)
  }

  /**
   * Pause (remove from rotation) or resume a user's songs in a room
   */
  static setPaused ({ isPaused, roomId, userId }: { isPaused: boolean, roomId: number, userId: number }): void {
    const query = isPaused
      ? sql`
        INSERT OR IGNORE INTO queuePauses (roomId, userId)
        VALUES (${roomId}, ${userId})
      `
      : sql`
        DELETE FROM queuePauses
        WHERE roomId = ${roomId} AND userId = ${userId}
      `
    db.run(String(query), query.parameters)
  }

  /**
   * Move a queue item
   */
  static move ({ prevQueueId, queueId, roomId }: { prevQueueId: number | null, queueId: number, roomId: number }): void {
    if (queueId === prevQueueId) {
      throw new Error('Invalid prevQueueId')
    }

    if (prevQueueId === -1) prevQueueId = null

    const query = sql`
      UPDATE queue
      SET prevQueueId = CASE
        WHEN queueId = newChild THEN ${queueId}
        WHEN queueId = curChild THEN curParent
        WHEN queueId = ${queueId} THEN ${prevQueueId}
        ELSE queue.prevQueueId
      END
      FROM (SELECT
        (
          SELECT prevQueueId
          FROM queue
          WHERE queueId = ${queueId}
        ) AS curParent,
        (
          SELECT queueId
          FROM queue
          WHERE prevQueueId = ${queueId}
        ) AS curChild,
        (
          SELECT queueId
          FROM queue
          WHERE queueId != ${queueId}
            AND prevQueueId ${prevQueueId === null ? sql`IS NULL` : sql`= ${prevQueueId}`}
            AND roomId = ${roomId}
        ) AS newChild
      )
      WHERE roomId = ${roomId}
    `
    db.run(String(query), query.parameters)
  }

  /**
   * Delete a queue item
   */
  static remove (queueId: number): void {
    db.exec('BEGIN IMMEDIATE')
    db.exec('PRAGMA defer_foreign_keys = ON') // v0.9 betas didn't have prevQueueId DEFERRABLE

    try {
      const deleteQuery = sql`
        DELETE FROM queue
        WHERE queueId = ${queueId}
        RETURNING prevQueueId
      `
      const deletedRow = db.get<{ prevQueueId: number | null }>(String(deleteQuery), deleteQuery.parameters)

      if (deletedRow === undefined) {
        throw new Error(`Could not remove queueId: ${queueId}`)
      }

      // close the gap
      const updateQuery = sql`
        UPDATE queue
        SET prevQueueId = ${deletedRow.prevQueueId}
        WHERE prevQueueId = ${queueId}
      `
      db.run(String(updateQuery), updateQuery.parameters)
      db.exec('COMMIT')
    } catch (err) {
      db.exec('ROLLBACK')
      throw err
    }
  }

  /**
   * Check if user owns queue item(s)
   */
  static isOwner (userId: number, queueId: number | number[]): boolean {
    const ids = Array.isArray(queueId) ? queueId : [queueId]
    if (ids.length === 0) return false

    const query = sql`
      SELECT COUNT(*) AS count
      FROM queue
      WHERE userId = ${userId} AND queueId IN ${sql.tuple(ids)}
    `
    const res = db.get<{ count: number }>(String(query), query.parameters)
    return res.count === ids.length
  }

  /**
   * Get media type from file extension
   */
  static getType (file: string): string {
    return /\.mp4/i.test(path.extname(file)) ? 'mp4' : 'cdg'
  }
}

export default Queue
