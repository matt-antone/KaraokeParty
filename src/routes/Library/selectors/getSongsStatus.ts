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
      const item = queue.entities[queueId]

      if (history.includes(queueId)) {
        played.push(item.songId)
      } else if (queueId !== curId) {
        upcoming.push(item.songId)

        // An optimistic row is never offered as dequeueable, even though it is
        // by definition your own: its queueId is one this client invented
        // while the server's answer is in flight, so a dequeue would name a
        // row nobody else has. The real row arrives a moment later and is
        // dequeueable then.
        //
        // Narrowed on `userId` rather than on `isOptimistic`, which is the
        // discriminant: this project compiles without strictNullChecks, so a
        // truthiness test on an optional `false` narrows nothing. `in` narrows
        // either way, and it is the field being reached for.
        //
        // first one wins: a song queued twice dequeues oldest-first
        if ('userId' in item && item.userId === userId && !(item.songId in mine)) {
          mine[item.songId] = queueId
        }
      }
    })

    return { played, upcoming, current: queue.entities[curId]?.songId, mine }
  },
)

export default getSongsStatus
