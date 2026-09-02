import type { RootState } from 'store/store'
import { createSelector } from '@reduxjs/toolkit'
import getPlayerHistory from './getPlayerHistory'
import getRoundRobinQueue from './getRoundRobinQueue'

const getQueueId = (state: RootState) => state.status.queueId
const getIsAtQueueEnd = (state: RootState) => state.status.isAtQueueEnd

/**
* Splits the round-robin queue into what's been sung and what's still coming.
* The current item counts as upcoming until the player reaches the queue's end.
*/
const getQueueSections = createSelector(
  [getRoundRobinQueue, getPlayerHistory, getQueueId, getIsAtQueueEnd],
  (queue, history, queueId, isAtQueueEnd) => {
    const played: number[] = []
    const upcoming: number[] = []

    for (const qId of queue.result) {
      const isPlayed = qId === queueId ? isAtQueueEnd : history.includes(qId)
      ;(isPlayed ? played : upcoming).push(qId)
    }

    return { played, upcoming }
  },
)

export default getQueueSections
