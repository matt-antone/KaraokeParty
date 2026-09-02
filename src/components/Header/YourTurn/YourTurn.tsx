import React from 'react'
import clsx from 'clsx'
import Button from 'components/Button/Button'
import VuMeter from 'components/VuMeter/VuMeter'
import styles from './YourTurn.css'

export interface YourTurnProps {
  /** This singer is on stage right now. */
  isUpNow?: boolean
  /** Pre-formatted wait until their next song, e.g. "4 min". */
  wait?: string
  /** Their place in the rotation, 1-based. 0 when they have nothing coming up. */
  position?: number
  /** How many singers are in the rotation. */
  rotationSize?: number
  /** How many songs they have queued. */
  songCount?: number
  /** Title of their next song — what they are actually waiting for. */
  nextSong?: string
  /**
   * 0-1: how far the room's queue has drained toward their turn. Ticks with
   * the playhead. Falls back to their place in the rotation when unknown.
   */
  waitLevel?: number
  /** They have stepped out of the rotation. */
  isPaused?: boolean
  onTogglePaused?: () => void
  /** Machine it into the header chrome rather than floating it as a panel. */
  inHeader?: boolean
  className?: string
}

/**
 * The app's header, on every screen. A singer glancing at their phone mid-party
 * is asking one question, so the answer sits at the top of whatever screen they
 * are on: when am I on, how deep in the rotation, and can I step out.
 *
 * This is the only status surface in the product. There is no one-line strip
 * and the Me tab does not repeat it.
 */
const YourTurn = ({
  isUpNow,
  wait,
  position = 0,
  rotationSize = 0,
  songCount = 0,
  nextSong,
  waitLevel,
  isPaused,
  onTogglePaused,
  inHeader,
  className,
}: YourTurnProps) => {
  // the meter fills as their turn approaches and empties completely when
  // paused. Position lives in the value, never in the segment count. waitLevel
  // is the live one — the room's queue draining toward them — and the rotation
  // index is the fallback for before the player has reported a position.
  const level = isPaused
    ? 0
    : isUpNow
      ? 1
      : waitLevel !== undefined
        ? waitLevel
        : position && rotationSize
          ? Math.max(0.06, 1 - (position - 1) / rotationSize)
          : 0.5

  const headline = isPaused ? 'Paused' : isUpNow ? 'Now' : wait || '--'

  const label = isPaused
    ? 'you are out of the rotation'
    : isUpNow
      ? 'you are on stage'
      : nextSong
        ? nextSong
        : position
          ? `${position} of ${rotationSize} in the rotation`
          : 'nothing queued'

  // Queued but not on stage is the same state the library gives a queued song:
  // "armed but not running", which the system says in standby teal. Amber is
  // for the channel that is actually live, so it waits until you are up.
  const isStandby = !isPaused && !isUpNow

  const pauseLabel = isPaused ? 'Resume my songs' : 'Pause my songs'

  return (
    <div className={clsx(styles.container, inHeader && styles.inHeader, isUpNow && !isPaused && styles.onStage, isStandby && styles.standby, isPaused && styles.paused, className)}>
      <div className={styles.headline}>
        <div className={clsx('silkscreen', styles.legend)}>your turn</div>
        <div className={styles.wait}>{headline}</div>
      </div>

      <div className={styles.meter}>
        {/* always 24 segments: the meter reads as a level filling toward your
            turn, which a 4-block meter cannot do */}
        <VuMeter value={level} segments={24} peakFrom={2} height={6} label='Your turn' />
        <div className={clsx('silkscreen', styles.label)}>{label}</div>
      </div>

      <div className={clsx('silkscreen', styles.songCount)}>
        {songCount}
        {' '}
        {songCount === 1 ? 'song' : 'songs'}
      </div>

      {/* possessive on purpose: pausing the *room* is a different, admin-only
          thing that lives in Settings > Player. Icon-only to keep the strip one
          row deep, so the name is carried by aria-label and the title tooltip. */}
      <Button
        className={styles.pauseKey}
        variant={isPaused ? 'primary' : 'default'}
        icon={isPaused ? 'PLAY' : 'PAUSE'}
        size={22}
        onClick={onTogglePaused}
        aria-label={pauseLabel}
        title={pauseLabel}
      />
    </div>
  )
}

export default YourTurn
