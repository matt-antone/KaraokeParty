import { describe, expect, it } from 'vitest'
import getSongsStatus from './getSongsStatus'

/**
 * A library row can dequeue only the signed-in user's *own* upcoming song:
 * `mine` is what carries the queueId that makes the tap possible, so it must
 * never pick up someone else's item, a played one, or the one on screen.
 *
 * alice (1) queued songs 10, 11 and 12; bob (2) queued 13 (song 10 again).
 */
const ENTITIES = {
  1: { queueId: 1, songId: 10, userId: 1 },
  2: { queueId: 2, songId: 11, userId: 1 },
  3: { queueId: 3, songId: 12, userId: 1 },
  4: { queueId: 4, songId: 10, userId: 2 },
  5: { queueId: 5, songId: 11, userId: 1 },
}

const state = ({ history = [], queueId = null, userId = 1, isAtQueueEnd = false }: {
  history?: number[]
  queueId?: number | null
  userId?: number
  isAtQueueEnd?: boolean
} = {}) => ({
  queue: { isLoading: false, result: [1, 2, 3, 4, 5], entities: ENTITIES },
  status: { historyJSON: JSON.stringify(history), queueId, isAtQueueEnd },
  user: { userId },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any

describe('getSongsStatus', () => {
  it('maps a song to the signed-in user\'s own queueId', () => {
    expect(getSongsStatus(state()).mine[12]).toBe(3)
  })

  it('never maps another singer\'s item', () => {
    // bob's only item is queueId 4; song 10 is alice's queueId 1
    expect(getSongsStatus(state({ userId: 2 })).mine).toEqual({ 10: 4 })
  })

  it('dequeues oldest-first when the same song is queued twice', () => {
    expect(getSongsStatus(state()).mine[11]).toBe(2)
  })

  it('leaves out the song now playing', () => {
    expect(getSongsStatus(state({ queueId: 1 })).mine[10]).toBeUndefined()
  })

  it('leaves out a played song', () => {
    expect(getSongsStatus(state({ history: [1] })).mine[10]).toBeUndefined()
  })
})
