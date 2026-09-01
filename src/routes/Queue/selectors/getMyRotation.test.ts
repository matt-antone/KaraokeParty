import { describe, expect, it } from 'vitest'
import getMyRotation from './getMyRotation'

/**
 * The header says "2 of 4 in the rotation". That counts *singers still to
 * come*, not songs — someone with three songs queued is one place in the
 * rotation, not three — and the meter's fill is derived from it, so getting
 * it wrong misreports when you are on.
 *
 * Fixture matches getRoundRobinQueue.test.ts: alice (1) queued 3 songs before
 * bob (2) queued 2, which round-robins to [1, 4, 2, 5, 3].
 */
const ENTITIES = {
  1: { queueId: 1, songId: 10, userId: 1, prevQueueId: null as number | null },
  2: { queueId: 2, songId: 11, userId: 1, prevQueueId: 1 },
  3: { queueId: 3, songId: 12, userId: 1, prevQueueId: 2 },
  4: { queueId: 4, songId: 13, userId: 2, prevQueueId: 3 },
  5: { queueId: 5, songId: 14, userId: 2, prevQueueId: 4 },
}

const state = ({ history = [], queueId = null, userId = 1, pausedUserIds = [] }: {
  history?: number[]
  queueId?: number | null
  userId?: number
  pausedUserIds?: number[]
} = {}) => ({
  queue: { isLoading: false, result: [1, 2, 3, 4, 5], entities: ENTITIES, pausedUserIds },
  status: { historyJSON: JSON.stringify(history), queueId, isAtQueueEnd: false, nextUserId: null },
  user: { userId },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any

describe('getMyRotation', () => {
  it('counts singers still to come, not songs', () => {
    // alice is singing queueId 1; what remains is [4, 2, 5, 3] — bob, alice,
    // bob, alice. Two singers, though five songs are queued.
    expect(getMyRotation(state({ queueId: 1, userId: 2 })))
      .toEqual({ position: 1, rotationSize: 2 })
  })

  it('counts a singer once however many songs they have queued', () => {
    // alice holds 3 of the 5 songs and is still one place in the rotation
    expect(getMyRotation(state({ queueId: 1, userId: 1 })))
      .toEqual({ position: 2, rotationSize: 2 })
  })

  it('orders by when each singer next sings, not by queue position', () => {
    // bob's first song (4) comes before alice's second (2), so bob is 1st
    const { position: bob } = getMyRotation(state({ queueId: 1, userId: 2 }))
    const { position: alice } = getMyRotation(state({ queueId: 1, userId: 1 }))
    expect(bob).toBeLessThan(alice)
  })

  it('reports position 0 for a singer with nothing coming up', () => {
    expect(getMyRotation(state({ queueId: 1, userId: 99 })).position).toBe(0)
  })

  it('walks the whole queue before the first song starts', () => {
    // nothing playing: everyone is still to come, alice first
    expect(getMyRotation(state({ queueId: null, userId: 1 })))
      .toEqual({ position: 1, rotationSize: 2 })
  })

  it('leaves a singer who is sitting out of the rotation entirely', () => {
    // getRoundRobinQueue drops paused singers, so bob is simply not counted
    expect(getMyRotation(state({ queueId: 1, userId: 1, pausedUserIds: [2] })))
      .toEqual({ position: 1, rotationSize: 1 })
  })
})
