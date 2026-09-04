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
      // A battle row carries the challenger in userId and the opponent in
      // opponentUserId, so filtering on userId alone hides it from the person
      // who is about to sing half of it: the opponent's Me tab shows nothing
      // coming up, and they find out they are on when the versus splash goes
      // up with their face on it. opponentUserId is 0 on every other row, and
      // no user has id 0, so this adds nothing anywhere else.
      //
      // ponytail: only the unpaused branch. getUpcoming, which feeds the
      // paused one, is shared with other callers and filters on userId alone —
      // a paused opponent loses sight of their battle until they unpause. Push
      // the same OR into getUpcoming if that turns out to bite.
      : sections.upcoming.filter((qId) => {
          const item = queue.entities[qId]
          return item.userId === userId || item.opponentUserId === userId
        })
  ),
)

export default getMyUpcoming
