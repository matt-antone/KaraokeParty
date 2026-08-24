import React, { useEffect, useState } from 'react'
import clsx from 'clsx'
import { useAppDispatch } from 'store/hooks'
import { requestPlay } from 'store/modules/status'
import ColorCycle from './ColorCycle/ColorCycle'
import UpNow from './UpNow/UpNow'
import Icon from 'components/Icon/Icon'
import UserImage from 'components/UserImage/UserImage'
import type { QueueItem } from 'shared/types'
import styles from './PlayerTextOverlay.css'

interface PlayerTextOverlayProps {
  queueItem?: QueueItem
  nextQueueItem?: QueueItem
  comingUpQueueItems?: QueueItem[]
  nextSongTitle?: string
  nextSongArtist?: string
  isSongEnding?: boolean
  isAtQueueEnd: boolean
  isQueueEmpty: boolean
  isErrored: boolean
  intermissionEndsAt?: number | null
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
  const [offset] = useState(() => Math.random() * -300)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const intervalID = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(intervalID)
  }, [])

  const secondsLeft = Math.max(0, Math.ceil((endsAt - now) / 1000))

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
      <ColorCycle
        text={nextQueueItem ? nextQueueItem.userDisplayName.toUpperCase() : 'UP NEXT...'}
        offset={offset}
        className={styles.backdrop}
      />
      <ColorCycle text={`${secondsLeft}`} offset={offset} className={styles.backdrop} />
      {comingUpQueueItems.length > 0 && (
        <div className={styles.comingUp} translate='no'>
          <span className={styles.comingUpHeading}>Coming Up</span>
          {comingUpQueueItems.map(item => item.userDisplayName).join(', ')}
        </div>
      )}
    </>
  )
}

const PlayerTextOverlay = ({
  isQueueEmpty,
  isAtQueueEnd,
  isErrored,
  intermissionEndsAt,
  nextQueueItem,
  comingUpQueueItems,
  nextSongTitle,
  nextSongArtist,
  isSongEnding,
  queueItem,
  width,
  height,
}: PlayerTextOverlayProps) => {
  const dispatch = useAppDispatch()
  const handlePlay = () => dispatch(requestPlay())
  const [errorOffset] = useState(() => Math.random() * -300)

  let Component

  if (isQueueEmpty || (isAtQueueEnd && !nextQueueItem)) {
    Component = <ColorCycle text='CAN HAZ MOAR SONGZ?' className={styles.backdrop} />
  } else if (!queueItem || (isAtQueueEnd && nextQueueItem)) {
    Component = (
      <>
        <svg width='0' height='0' style={{ position: 'absolute' }}>
          <defs>
            <linearGradient id='play-icon-gradient' x1='0%' y1='0%' x2='100%' y2='100%'>
              <stop offset='0%' className={styles.gradientStop1} />
              <stop offset='100%' className={styles.gradientStop2} />
            </linearGradient>
          </defs>
        </svg>
        <button className={styles.playButton} onClick={handlePlay} aria-label='Play'>
          <Icon icon='PLAY' />
        </button>
      </>
    )
  } else if (isErrored) {
    Component = (
      <>
        <ColorCycle text='OOPS...' offset={errorOffset} className={styles.backdrop} />
        <ColorCycle text='SEE QUEUE FOR DETAILS' offset={errorOffset} className={styles.backdrop} />
      </>
    )
  } else if (intermissionEndsAt) {
    Component = (
      <Intermission
        key={intermissionEndsAt}
        endsAt={intermissionEndsAt}
        nextQueueItem={nextQueueItem}
        nextSongTitle={nextSongTitle}
        nextSongArtist={nextSongArtist}
        comingUpQueueItems={comingUpQueueItems}
      />
    )
  } else {
    Component = (
      <>
        <UpNow key={queueItem.queueId} queueItem={queueItem} />
        {isSongEnding && nextQueueItem && (
          <div className={styles.upNext} translate='no'>
            {`Up Next: ${nextQueueItem.userDisplayName}`}
          </div>
        )}
      </>
    )
  }

  return (
    <div style={{ width, height }} className={clsx(styles.container, intermissionEndsAt && styles.intermission)}>
      {Component}
    </div>
  )
}

export default PlayerTextOverlay
