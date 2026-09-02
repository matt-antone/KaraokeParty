import React, { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import type { RootState } from 'store/store'
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
import Logo from 'components/Logo/Logo'
import ProgressBar from './ProgressBar/ProgressBar'
import YourTurn from './YourTurn/YourTurn'
import styles from './Header.css'

// selectors
const getIsAtQueueEnd = (state: RootState) => state.status.isAtQueueEnd
const getQueueId = (state: RootState) => state.status.queueId
const getUserId = (state: RootState) => state.user.userId

/**
 * The singer's next song: its queue id, the wait until it in seconds, and its
 * title. One lookup — the headline, the meter and the label all describe the
 * same song, and getWaits is recomputed from song durations and the live
 * playhead, so the wait ticks down every second the player reports.
 */
const getMyNext = createSelector(
  [getMyUpcoming, getWaits, (state: RootState) => ensureState(state.queue).entities, (state: RootState) => state.songs],
  (upcoming, waits, queueItems, songs): { queueId?: number, wait?: number, title?: string } => {
    const queueId = upcoming[0]
    const item = queueItems[queueId]

    return {
      queueId,
      wait: waits[queueId],
      title: item ? songs.entities[item.songId]?.title : undefined,
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

// How far the faceplate is currently slid up, in px. Written to the DOM rather
// than to state: this changes every scroll frame, and a re-render here would
// re-render the virtualized library list with it. Set on the root element (not
// just the faceplate) so other fixed chrome — e.g. the library's AlphaPicker
// rail — can also track it via CSS var inheritance.
const setChromeShift = (px: number) => {
  document.documentElement.style.setProperty('--chrome-shift', `${px}px`)
}

// component
const Header = React.forwardRef<HTMLDivElement>((_, ref) => {
  const isAdmin = useAppSelector(state => state.user.isAdmin)
  const isPlayerPresent = useAppSelector(state => state.status.isPlayerPresent)
  const isScanning = useAppSelector(state => state.prefs.isScanning)
  const scannerText = useAppSelector(state => state.prefs.scannerText)
  const scannerPct = useAppSelector(state => state.prefs.scannerPct)
  const userId = useAppSelector(getUserId)
  const isUpNow = useAppSelector(getIsUpNow)
  const { position, rotationSize } = useAppSelector(getMyRotation)
  const songCount = useAppSelector(getMyUpcoming).length
  const { queueId: nextQueueId, wait, title: nextSong } = useAppSelector(getMyNext)

  // The meter's full scale is the singer's OWN wait when this song became their
  // next, remembered so it survives the wait ticking down. Measuring against the
  // room's furthest-out wait instead let other people's songs — queued BEHIND
  // this singer, unable to affect their wait at all — decide where their meter
  // started: someone six minutes out began two thirds full. Re-arms upward when
  // the wait grows, which is someone being inserted ahead of them.
  const [horizon, setHorizon] = useState<{ queueId?: number, wait: number }>({ wait: 0 })
  const isSameSong = nextQueueId === horizon.queueId
  const scale = wait === undefined
    ? horizon.wait
    : isSameSong ? Math.max(horizon.wait, wait) : wait

  if (wait !== undefined && (!isSameSong || wait > horizon.wait)) {
    setHorizon({ queueId: nextQueueId, wait })
  }

  const waitLevel = wait === undefined || scale <= 0
    ? undefined
    // floored so a singer who just queued reads as lit-but-low, not switched off
    : Math.max(0.06, 1 - wait / scale)

  const isPaused = useAppSelector(state => ensureState(state.queue).pausedUserIds.includes(userId))
  const roomName = useAppSelector(state => (
    state.user.roomId === null ? undefined : state.rooms.entities[state.user.roomId]?.name
  ))

  const location = useLocation()
  const isPlayer = location.pathname.replace(/\/$/, '').endsWith('/player')

  const dispatch = useAppDispatch()
  const cancelScan = () => dispatch(requestScanStop())

  const wordmarkRef = useRef<HTMLDivElement>(null)

  // Slide the faceplate up with the scroll so the wordmark row reads as
  // scrolling away, capped so YourTurn and the route header below it stay
  // pinned (see Header.css). Every route is a separate full-viewport
  // scroller — three plain divs and react-window's — so this listens on the
  // capture phase at the document instead of being wired up four times; scroll
  // does not bubble, but it does capture. Modals scroll on their own and must
  // not move the chrome.
  useEffect(() => {
    const onScroll = (e: Event) => {
      // A body-scrolling route (Account, Settings) reports the document as the
      // target; an inner scroller reports itself.
      const el = e.target === document ? document.documentElement : e.target
      if (!(el instanceof HTMLElement) || el.closest('dialog')) return

      const wordmark = wordmarkRef.current
      const faceplate = wordmark?.parentElement
      // On Account and Settings the wordmark is the whole faceplate and only
      // the seam rule would be left pinned, so take the faceplate instead of
      // the row. ponytail: a 1px slack test rather than asking each child
      // whether it rendered anything; revisit if a hairline row is ever added
      // below the wordmark.
      const cap = !wordmark || !faceplate
        ? 0
        : faceplate.offsetHeight - wordmark.offsetHeight <= 1
          ? faceplate.offsetHeight
          : wordmark.offsetHeight

      // clamped below at 0 for rubber-band overscroll, which reports negative
      setChromeShift(Math.min(Math.max(el.scrollTop, 0), cap))
    }

    document.addEventListener('scroll', onScroll, true)
    return () => document.removeEventListener('scroll', onScroll, true)
  }, [])

  // A route change swaps in a fresh scroller at the top; anything that restores
  // a scroll position (Library, Queue) does it by scrolling, which fires above.
  useEffect(() => {
    setChromeShift(0)
  }, [location.pathname])

  return (
    <div className={styles.container} ref={ref}>
      {/* the wordmark and the room you are in. Not on the player, which is a
          room fixture rather than a screen someone navigates. */}
      {!isPlayer && (
        <div className={styles.wordmarkRow} ref={wordmarkRef}>
          <Logo withMark />
          {roomName && <span className={clsx('silkscreen', styles.room)} translate='no'>{roomName}</span>}
        </div>
      )}

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
            nextSong={nextSong}
            waitLevel={waitLevel}
            onTogglePaused={() => dispatch(setPaused({ isPaused: !isPaused }))}
          />
        )}

      {isAdmin && !isPlayer
        && (
          <ProgressBar
            isActive={isScanning}
            onCancel={cancelScan}
            pct={scannerPct}
            text={scannerText}
          />
        )}

      {/* only these two routes add a header of their own. Without the
          catch-all, react-router logs "No routes matched" on every render
          from /account, /settings and /. */}
      <Routes>
        <Route path='/library' element={<LibraryHeader />} />
        <Route path='/queue' element={<QueueHeader />} />
        <Route path='*' element={null} />
      </Routes>
    </div>
  )
})

Header.displayName = 'Header'

export default Header
