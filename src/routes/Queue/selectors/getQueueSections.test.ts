import { describe, it, expect } from 'vitest'
import getQueueSections from './getQueueSections'

const ENTITIES = {
  1: { queueId: 1, songId: 10, userId: 1, prevQueueId: null as number | null },
  2: { queueId: 2, songId: 11, userId: 1, prevQueueId: 1 },
  3: { queueId: 3, songId: 12, userId: 1, prevQueueId: 2 },
  4: { queueId: 4, songId: 13, userId: 1, prevQueueId: 3 },
}

const state = ({ history, queueId, isAtQueueEnd = false }: {
  history: number[]
  queueId: number
  isAtQueueEnd?: boolean
}) => ({
  queue: { isLoading: false, result: [1, 2, 3, 4], entities: ENTITIES },
  status: {
    historyJSON: JSON.stringify(history),
    queueId,
    isAtQueueEnd,
    nextUserId: null,
  },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any

describe('getQueueSections', () => {
  it('splits sung songs from the rest', () => {
    expect(getQueueSections(state({ history: [1, 2], queueId: 3 })))
      .toEqual({ played: [1, 2], upcoming: [3, 4] })
  })

  it('keeps the current song upcoming while it plays', () => {
    // the player reports queueId in history as soon as it starts
    expect(getQueueSections(state({ history: [1, 2, 3], queueId: 3 })).upcoming)
      .toEqual([3, 4])
  })

  it('counts the current song as sung once the queue ends', () => {
    expect(getQueueSections(state({ history: [1, 2, 3], queueId: 3, isAtQueueEnd: true })))
      .toEqual({ played: [1, 2, 3], upcoming: [4] })
  })

  it('has nothing played before the first song', () => {
    expect(getQueueSections(state({ history: [], queueId: null })))
      .toEqual({ played: [], upcoming: [1, 2, 3, 4] })
  })
})
