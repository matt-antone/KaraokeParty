import type { RootState } from 'store/store'
import { createSelector } from '@reduxjs/toolkit'
import getRoundRobinQueue from './getRoundRobinQueue'

const getQueueId = (state: RootState) => state.status.queueId
const getUserId = (state: RootState) => state.user.userId

/**
 * Where this singer sits in the rotation, and how many singers are in it.
 *
 * The rotation is the set of *distinct singers* still to come, in the order
 * they will sing — not the queue of songs. Someone with three songs queued is
 * one place in the rotation, not three, which is what "2 of 4" has to mean for
 * the header to answer "when am I on".
 *
 * getRoundRobinQueue has already ordered the queue and dropped anyone sitting
 * out, so walking it forward from the current song gives that order directly.
 *
 * position is 1-based, or 0 when this singer has nothing coming up.
 */
const getMyRotation = createSelector(
  [getRoundRobinQueue, getQueueId, getUserId],
  (queue, queueId, userId) => {
    const { result, entities } = queue
    const order: number[] = []

    // indexOf returns -1 when nothing is playing, so this starts at 0 and walks
    // the whole queue — which is what we want before the first song starts
    for (const qId of result.slice(result.indexOf(queueId) + 1)) {
      const singer = entities[qId]?.userId
      if (singer !== undefined && !order.includes(singer)) order.push(singer)
    }

    return {
      position: order.indexOf(userId) + 1,
      rotationSize: order.length,
    }
  },
)

export default getMyRotation
