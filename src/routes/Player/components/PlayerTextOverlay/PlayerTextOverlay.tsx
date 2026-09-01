import React, { useEffect, useState } from 'react'
import clsx from 'clsx'
import screenfull from 'screenfull'
import { useAppDispatch } from 'store/hooks'
import { requestPlay } from 'store/modules/status'
import CornerPanel from './CornerPanel/CornerPanel'
import PlayerHeadline from './PlayerHeadline/PlayerHeadline'
import Icon from 'components/Icon/Icon'
import UserImage from 'components/UserImage/UserImage'
import VuMeter from 'components/VuMeter/VuMeter'
import type { QueueItem } from 'shared/types'
import styles from './PlayerTextOverlay.css'

/** How long the "on stage" panel names the singer at the top of a song. */
const UP_NOW_MS = 5000
/** Queue depth that fills the bottom meter. Beyond it the room just reads "long". */
const QUEUE_DEPTH_FULL = 20
/** How long the fullscreen key stays up after the host last moved the mouse. */
const POINTER_IDLE_MS = 3000

/** Six mutually exclusive states — never two at once. */
type OverlayState = 'upNow' | 'upNextTease' | 'intermission' | 'idle' | 'empty' | 'errored'

interface PlayerTextOverlayProps {
  queueItem?: QueueItem
  nextQueueItem?: QueueItem
  comingUpQueueItems?: QueueItem[]
  songTitle?: string
  songArtist?: string
  nextSongTitle?: string
  nextSongArtist?: string
  isSongEnding?: boolean
  isAtQueueEnd: boolean
  isQueueEmpty: boolean
  isErrored: boolean
  intermissionEndsAt?: number | null
  /** Songs still to come. Drives the bottom queue-depth meter. */
  queueDepth?: number
  width: number
  height: number
}

// mounted when the intermission starts, so `now` is seeded correctly (keyed on endsAt by the parent)
const Intermission = ({ endsAt, nextQueueItem, nextSongTitle, nextSongArtist, comingUpQueueItems = [] }: {
  endsAt: number
  nextQueueItem?: QueueItem
  nextSongTitle?: string
  nextSongArtist?: string
  comingUpQueueItems?: QueueItem[]
}) => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const intervalID = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(intervalID)
  }, [])

  const secondsLeft = Math.max(0, Math.ceil((endsAt - now) / 1000))

  // one order, always: next song, face, name, countdown, coming up
  return (
    <>
      {nextSongTitle && (
        <div className={styles.nextSong} translate='no'>
          <div className={styles.nextSongTitle}>{nextSongTitle}</div>
          {nextSongArtist && <div className={styles.nextSongArtist}>{nextSongArtist}</div>}
        </div>
      )}
      {nextQueueItem && (
        <UserImage
          userId={nextQueueItem.userId}
          dateUpdated={nextQueueItem.userDateUpdated}
          className={styles.nextUserImage}
        />
      )}
      <PlayerHeadline tone='vu'>{nextQueueItem ? nextQueueItem.userDisplayName : 'Up next'}</PlayerHeadline>
      <PlayerHeadline key={secondsLeft} size='var(--display-xl)' className={styles.countdown}>
        {secondsLeft}
      </PlayerHeadline>
      {comingUpQueueItems.length > 0 && (
        <div className={styles.comingUp} translate='no'>
          <div className={clsx('silkscreen', styles.comingUpHeading)}>coming up</div>
          {comingUpQueueItems.map(item => item.userDisplayName).join(', ')}
        </div>
      )}
    </>
  )
}

// The panel names who is on stage for the first seconds of a song, then clears out
// of the way. The parent keys us on queueId, so the next song starts the timer again.
const UpNow = ({ singer, songTitle, songArtist }: {
  singer: string
  songTitle?: string
  songArtist?: string
}) => {
  const [show, setShow] = useState(true)

  // requestAnimationFrame doesn't run while the player's tab is hidden, so the
  // reveal is never gated on one: the panel would outlive the timer that hides it
  useEffect(() => {
    const timeoutID = setTimeout(() => setShow(false), UP_NOW_MS)
    return () => clearTimeout(timeoutID)
  }, [])

  if (!show) return null

  return <CornerPanel label='on stage' tone='vu' singer={singer} songTitle={songTitle} songArtist={songArtist} />
}

const handleFullscreen = () => {
  if (screenfull.isEnabled) screenfull.request(document.getElementById('player-fs-container'))
}

const PlayerTextOverlay = ({
  isQueueEmpty,
  isAtQueueEnd,
  isErrored,
  intermissionEndsAt,
  nextQueueItem,
  comingUpQueueItems,
  songTitle,
  songArtist,
  nextSongTitle,
  nextSongArtist,
  isSongEnding,
  queueItem,
  queueDepth = 0,
  width,
  height,
}: PlayerTextOverlayProps) => {
  const dispatch = useAppDispatch()
  const handlePlay = () => dispatch(requestPlay())
  const [lastPointerMove, setLastPointerMove] = useState(0)

  // The transport moved to Settings and took its fullscreen key with it, so this
  // is now the only way into fullscreen once a song starts. A room TV is driven
  // with a mouse, not touched, so the key behaves like any video player's chrome:
  // it appears on pointer activity and clears itself again, which keeps it off
  // the video the rest of the night.
  useEffect(() => {
    if (!lastPointerMove) return

    const timeoutID = setTimeout(() => setLastPointerMove(0), POINTER_IDLE_MS)
    return () => clearTimeout(timeoutID)
  }, [lastPointerMove])

  // a mouse fires dozens of moves a second; returning the previous value unchanged
  // lets React bail out of the re-render, so only one move per second costs anything
  const handlePointerMove = () => setLastPointerMove(prev => Date.now() - prev > 1000 ? Date.now() : prev)

  let state: OverlayState

  if (isQueueEmpty || (isAtQueueEnd && !nextQueueItem)) state = 'empty'
  else if (!queueItem || (isAtQueueEnd && nextQueueItem)) state = 'idle'
  else if (isErrored) state = 'errored'
  else if (intermissionEndsAt) state = 'intermission'
  else if (isSongEnding && nextQueueItem) state = 'upNextTease'
  else state = 'upNow'

  // always up on the paused stage, as the handoff specifies; elsewhere only while
  // the host is at the machine. The corner panel shares this corner, so the
  // container drops the panel clear of the key for as long as the key is up.
  const isFullscreenKeyShown = screenfull.isEnabled && !screenfull.isFullscreen
    && (state === 'idle' || lastPointerMove !== 0)

  return (
    <div
      style={{ width, height }}
      onPointerMove={handlePointerMove}
      className={clsx(
        styles.container,
        state === 'intermission' && styles.intermission,
        isFullscreenKeyShown && styles.fullscreenKeyShown,
      )}
    >
      {state === 'empty' && (
        <>
          <div className={clsx('silkscreen', styles.stateLabel)}>queue empty</div>
          <PlayerHeadline tone='vu'>Add a song</PlayerHeadline>
        </>
      )}

      {state === 'errored' && (
        <>
          <div className={clsx('silkscreen', styles.stateLabel, styles.fault)}>fault</div>
          <PlayerHeadline>Media failed</PlayerHeadline>
          <div className={clsx('silkscreen', styles.stateFooter)}>see the queue for details</div>
        </>
      )}

      {/* browsers won't autoplay without a tap */}
      {state === 'idle' && (
        <button className={styles.playKey} onClick={handlePlay} aria-label='Play'>
          <Icon icon='PLAY' />
        </button>
      )}

      {isFullscreenKeyShown && (
        <button className={styles.fullscreenKey} onClick={handleFullscreen} aria-label='Fullscreen'>
          <Icon icon='FULLSCREEN' />
        </button>
      )}

      {state === 'intermission' && (
        <Intermission
          key={intermissionEndsAt}
          endsAt={intermissionEndsAt}
          nextQueueItem={nextQueueItem}
          nextSongTitle={nextSongTitle}
          nextSongArtist={nextSongArtist}
          comingUpQueueItems={comingUpQueueItems}
        />
      )}

      {state === 'upNow' && (
        <UpNow
          key={queueItem.queueId}
          singer={queueItem.userDisplayName}
          songTitle={songTitle}
          songArtist={songArtist}
        />
      )}

      {state === 'upNextTease' && (
        <CornerPanel
          label='up next'
          singer={nextQueueItem.userDisplayName}
          songTitle={nextSongTitle}
          songArtist={nextSongArtist}
        />
      )}

      {/* how long the list is, without anyone asking. Hidden when nothing is queued,
          and during the intermission, which is the one takeover. */}
      {queueDepth > 0 && state !== 'intermission' && (
        <div className={styles.queueDepth}>
          <span className={clsx('silkscreen', styles.queueDepthLabel)}>{`queue ${String(queueDepth).padStart(2, '0')}`}</span>
          <VuMeter
            value={Math.min(1, queueDepth / QUEUE_DEPTH_FULL)}
            segments={30}
            peakFrom={2}
            height={5}
            label='Songs still to come'
          />
        </div>
      )}
    </div>
  )
}

export default PlayerTextOverlay
