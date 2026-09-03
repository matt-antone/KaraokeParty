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
   * Get queued items for a given room
   */
  static get (roomId: number): { result: number[], entities: Record<number, QueueItem>, pausedUserIds: number[] } {
    const result: number[] = []
    const entities: Record<number, any> = {}
    const map = new Map()
    const pathData = new Map()
    let curQueueId = null

    const query = sql`
      SELECT queueId, songId, userId, prevQueueId, keyChange,
        media.mediaId, media.relPath, media.rgTrackGain, media.rgTrackPeak,
        users.name AS userDisplayName, users.dateUpdated AS userDateUpdated,
        paths.pathId, paths.data AS pathData,
        MAX(isPreferred) AS isPreferred
      FROM queue
        INNER JOIN users USING(userId)
        INNER JOIN media USING(songId)
        INNER JOIN paths USING(pathId)
      WHERE roomId = ${roomId}
      GROUP BY queueId
      ORDER BY queueId, paths.priority ASC
    `
    const rows = db.all<{
      queueId: number
      songId: number
      userId: number
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
      entities[row.queueId].mediaType = this.getType(row.relPath)
      entities[row.queueId].isVideoKeyingEnabled = !!pathPrefs?.isVideoKeyingEnabled

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
   * Empty a room's queue and lift every pause in it, so the room can host a
   * new night without being re-created. prevQueueId is self-referential, so
   * the whole room goes in one statement with foreign keys deferred rather
   * than row by row through remove()
   */
  static clear (roomId: number): void {
    db.exec('BEGIN IMMEDIATE')
    db.exec('PRAGMA defer_foreign_keys = ON')

    try {
      const deleteQueue = sql`
        DELETE FROM queue
        WHERE roomId = ${roomId}
      `
      db.run(String(deleteQueue), deleteQueue.parameters)

      // a pause left over from last night silently keeps a singer out of the
      // rotation, and nothing on screen says why
      const deletePauses = sql`
        DELETE FROM queuePauses
        WHERE roomId = ${roomId}
      `
      db.run(String(deletePauses), deletePauses.parameters)
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
