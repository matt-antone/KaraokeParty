import type { RootState } from 'store/store'
import { createSelector, type Selector } from '@reduxjs/toolkit'
import { ensureState } from 'redux-optimistic-ui'

const getQueue = (state: RootState) => ensureState(state.queue)
const getCurrentQueueId = (state: RootState) => state.status.isAtQueueEnd ? undefined : state.status.queueId
const getPlayerHistoryJSON = (state: RootState) => state.status.historyJSON
const getUserId = (state: RootState) => state.user.userId

type SongsStatus = {
  played: number[]
  upcoming: number[]
  current: number | undefined
  /** songId -> the signed-in user's own queueId for it, so the library row can dequeue */
  mine: Record<number, number>
}

const getSongsStatus: Selector<RootState, SongsStatus> = createSelector(
  [getQueue, getCurrentQueueId, getPlayerHistoryJSON, getUserId],
  (queue, curId, historyJSON, userId): SongsStatus => {
    const history = JSON.parse(historyJSON)
    const played: number[] = []
    const upcoming: number[] = []
    const mine: Record<number, number> = {}

    queue.result.forEach((queueId) => {
      const { songId, userId: itemUserId } = queue.entities[queueId]

      if (history.includes(queueId)) {
        played.push(songId)
      } else if (queueId !== curId) {
        upcoming.push(songId)

        // first one wins: a song queued twice dequeues oldest-first
        if (itemUserId === userId && !(songId in mine)) {
          mine[songId] = queueId
        }
      }
    })

    return { played, upcoming, current: queue.entities[curId]?.songId, mine }
  },
)

export default getSongsStatus
