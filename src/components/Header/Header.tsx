import React from 'react'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { RootState } from 'store/store'
import { Routes, Route, useLocation } from 'react-router'
import { createSelector } from '@reduxjs/toolkit'

import { ensureState } from 'redux-optimistic-ui'
import { formatSeconds } from 'lib/dateTime'
import { requestScanStop } from 'store/modules/prefs'
import { setPaused } from 'routes/Queue/modules/queue'
import getMyRotation from 'routes/Queue/selectors/getMyRotation'
import getMyUpcoming from 'routes/Queue/selectors/getMyUpcoming'
import getRoundRobinQueue from 'routes/Queue/selectors/getRoundRobinQueue'
import getWaits from 'routes/Queue/selectors/getWaits'
import LibraryHeader from 'routes/Library/components/LibraryHeader/LibraryHeader'
import QueueHeader from 'routes/Queue/components/QueueHeader/QueueHeader'
import PlaybackCtrl from './PlaybackCtrl/PlaybackCtrl'
import ProgressBar from './ProgressBar/ProgressBar'
import YourTurn from './YourTurn/YourTurn'
import styles from './Header.css'

// selectors
const getIsAtQueueEnd = (state: RootState) => state.status.isAtQueueEnd
const getQueueId = (state: RootState) => state.status.queueId
const getUserId = (state: RootState) => state.user.userId

const getUserWait = createSelector(
  [getRoundRobinQueue, getQueueId, getUserId, getWaits],
  (queue, queueId, userId, waits) => {
    const curIdx = queue.result.indexOf(queueId)

    for (let i = curIdx + 1; i < queue.result.length; i++) {
      if (queue.entities[queue.result[i]].userId === userId) {
        return waits[queue.result[i]]
      }
    }
  },
)

const getIsUpNow = createSelector(
  [getRoundRobinQueue, getQueueId, getIsAtQueueEnd, getUserId],
  (queue, queueId, isAtQueueEnd, userId) => {
    const curItem = queue.entities[queueId]
    return curItem ? !isAtQueueEnd && curItem.userId === userId : false
  },
)

// component
const Header = React.forwardRef<HTMLDivElement>((_, ref) => {
  const isAdmin = useAppSelector(state => state.user.isAdmin)
  const isPlayerPresent = useAppSelector(state => state.status.isPlayerPresent)
  const isScanning = useAppSelector(state => state.prefs.isScanning)
  const scannerText = useAppSelector(state => state.prefs.scannerText)
  const scannerPct = useAppSelector(state => state.prefs.scannerPct)
  const userId = useAppSelector(getUserId)
  const isUpNow = useAppSelector(getIsUpNow)
  const wait = useAppSelector(getUserWait)
  const { position, rotationSize } = useAppSelector(getMyRotation)
  const songCount = useAppSelector(getMyUpcoming).length
  const isPaused = useAppSelector(state => ensureState(state.queue).pausedUserIds.includes(userId))

  const location = useLocation()
  const isPlayer = location.pathname.replace(/\/$/, '').endsWith('/player')

  const dispatch = useAppDispatch()
  const cancelScan = () => dispatch(requestScanStop())

  return (
    <div className={clsx(styles.container, 'bg-blur')} ref={ref}>
      {/* nothing queued and not sitting out means no status to report */}
      {!isPlayer && isPlayerPresent && (songCount > 0 || isPaused)
        && (
          <YourTurn
            inHeader
            isUpNow={isUpNow}
            isPaused={isPaused}
            wait={wait === undefined ? undefined : formatSeconds(wait, true)}
            position={position}
            rotationSize={rotationSize}
            songCount={songCount}
            onTogglePaused={() => dispatch(setPaused({ isPaused: !isPaused }))}
          />
        )}

      {(isUpNow || isAdmin)
        && <PlaybackCtrl />}

      {isAdmin && !isPlayer
        && (
          <ProgressBar
            isActive={isScanning}
            onCancel={cancelScan}
            pct={scannerPct}
            text={scannerText}
          />
        )}

      <Routes>
        <Route path='/library' element={<LibraryHeader />} />
        <Route path='/queue' element={<QueueHeader />} />
      </Routes>
    </div>
  )
})

Header.displayName = 'Header'

export default Header
