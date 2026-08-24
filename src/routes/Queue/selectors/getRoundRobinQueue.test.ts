import { describe, it, expect } from 'vitest'
import getRoundRobinQueue from './getRoundRobinQueue'

// alice (1) queued 3 songs before bob (2) queued 2
const ENTITIES = {
  1: { queueId: 1, songId: 10, userId: 1, prevQueueId: null as number | null },
  2: { queueId: 2, songId: 11, userId: 1, prevQueueId: 1 },
  3: { queueId: 3, songId: 12, userId: 1, prevQueueId: 2 },
  4: { queueId: 4, songId: 13, userId: 2, prevQueueId: 3 },
  5: { queueId: 5, songId: 14, userId: 2, prevQueueId: 4 },
}

const state = ({ history = [], queueId = null, pausedUserIds = [], nextUserId = null }: {
  history?: number[]
  queueId?: number | null
  pausedUserIds?: number[]
  nextUserId?: number | null
} = {}) => ({
  queue: { isLoading: false, result: [1, 2, 3, 4, 5], entities: ENTITIES, pausedUserIds },
  status: {
    historyJSON: JSON.stringify(history),
    queueId,
    isAtQueueEnd: false,
    nextUserId,
  },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any

describe('getRoundRobinQueue', () => {
  it('alternates singers', () => {
    expect(getRoundRobinQueue(state()).result).toEqual([1, 4, 2, 5, 3])
  })

  it('drops a paused singer\'s upcoming songs', () => {
    expect(getRoundRobinQueue(state({ pausedUserIds: [2] })).result).toEqual([1, 2, 3])
  })

  it('keeps a paused singer\'s sung songs and the song they\'re singing', () => {
    expect(getRoundRobinQueue(state({ history: [1, 4], queueId: 4, pausedUserIds: [2] })).result)
      .toEqual([1, 4, 2, 3])
  })

  it('re-queues round robin on resume', () => {
    // alice sang two in a row while bob was out
    const played = { history: [1, 2], queueId: 2 }
    expect(getRoundRobinQueue(state({ ...played, pausedUserIds: [2] })).result).toEqual([1, 2, 3])
    expect(getRoundRobinQueue(state(played)).result).toEqual([1, 2, 4, 3, 5])
  })

  it('does not lock in a singer who just paused', () => {
    expect(getRoundRobinQueue(state({ history: [1], queueId: 1, nextUserId: 2, pausedUserIds: [2] })).result)
      .toEqual([1, 2, 3])
  })
})
