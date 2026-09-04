import React from 'react'
import clsx from 'clsx'
import Highlighter from 'react-highlight-words'
import ButtonStar from 'components/ButtonStar/ButtonStar'
import { formatDuration } from 'lib/dateTime'
import styles from './SongItem.css'

interface SongItemProps {
  songId: number
  artist?: string
  title: string
  tags: string[]
  duration: number
  onSongQueue(songId: number): void
  onSongDequeue(queueId: number): void
  onSongStarClick(songId: number): void
  isPlayed: boolean
  isStarred: boolean
  isUpcoming: boolean
  isAdmin: boolean
  /** Set when this song is the signed-in user's own upcoming item: tapping takes it back out. */
  myQueueId?: number
  numStars: number
  numMedia: number
  filterKeywords: string[]
}

/**
 * The library's unit of action: an un-queued song is a raised key, a queued
 * song drops to a teal standby well and goes inert, a played song loses its
 * key face entirely and dims down the ink ramp. One tap queues it, and one
 * more takes your own queued song back out — the star is the row's only
 * other action.
 */
const SongItem = ({
  songId,
  artist,
  title,
  tags,
  duration,
  onSongQueue,
  onSongDequeue,
  onSongStarClick,
  isPlayed,
  isStarred,
  isUpcoming,
  isAdmin,
  myQueueId,
  numStars,
  numMedia,
  filterKeywords,
}: SongItemProps) => {
  const isMine = myQueueId !== undefined
  const isInert = (isUpcoming || isPlayed) && !isMine
  const handleClick = () => isMine ? onSongDequeue(myQueueId) : onSongQueue(songId)
  const handleStarClick = () => onSongStarClick(songId)

  return (
    <div
      className={clsx(
        styles.container,
        isPlayed && styles.played,
        isUpcoming && styles.upcoming,
      )}
    >
      <div className={styles.duration}>
        {formatDuration(duration)}
      </div>

      <button
        type='button'
        onClick={isInert ? undefined : handleClick}
        disabled={isInert}
        aria-label={isMine ? `Remove ${title} from queue` : undefined}
        className={styles.primary}
      >
        {/* titles always show in full: they wrap, and the row grows to fit */}
        <span className={styles.title}>
          {filterKeywords?.length ? <Highlighter autoEscape textToHighlight={title} searchWords={filterKeywords} /> : title}
          {isAdmin && numMedia > 1 && <span className={styles.numMedia}>{` (${numMedia})`}</span>}
        </span>
        {(artist || tags.length > 0) && (
          <span className={styles.meta}>
            {[artist, tags.join(' · ')].filter(Boolean).join(' · ')}
          </span>
        )}
      </button>

      {isUpcoming
        ? <span className={styles.queued}>{isMine ? 'TAP TO REMOVE' : 'QUEUED'}</span>
        : (
            <ButtonStar
              className={styles.btn}
              onClick={handleStarClick}
              isStarred={isStarred}
              count={numStars}
            />
          )}
    </div>
  )
}

export default SongItem
