import type { RootState } from 'store/store'
import { ensureState } from 'redux-optimistic-ui'
import { createSelector } from '@reduxjs/toolkit'
import getQueueSections from './getQueueSections'
import getRoundRobinQueue from './getRoundRobinQueue'
import getUpcoming from './getUpcoming'

const getUserId = (state: RootState) => state.user.userId
const getPausedUserIds = (state: RootState) => ensureState(state.queue).pausedUserIds
const getMyPaused = (state: RootState) => getUpcoming(state, state.user.userId)

/**
 * The signed-in user's upcoming songs, including any held back by their pause
 * (paused songs are out of the round-robin rotation entirely)
 */
const getMyUpcoming = createSelector(
  [getQueueSections, getRoundRobinQueue, getUserId, getPausedUserIds, getMyPaused],
  (sections, queue, userId, pausedUserIds, myPaused) => (
    pausedUserIds.includes(userId)
      ? myPaused
      : sections.upcoming.filter(qId => queue.entities[qId].userId === userId)
  ),
)

export default getMyUpcoming
