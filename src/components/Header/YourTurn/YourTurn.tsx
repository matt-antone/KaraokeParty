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
  /**
   * Open the battle roster. Its presence is what puts the Battle key in the
   * strip at all: a key with nothing behind it is worse than no key, and the
   * strip has room for exactly one more thing (see the song-count note below).
   */
  onBattle?: () => void
  /** The room pref. False leaves the key in place but dead, so the feature is
   *  discoverable and the reason it is unavailable is one long-press away. */
  isBattleEnabled?: boolean
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
  onBattle,
  isBattleEnabled,
  inHeader,
  className,
}: YourTurnProps) => {
  // the meter fills as their turn approaches and empties completely when
  // paused. Position lives in the value, never in the segment count. waitLevel
  // is the live one — the room's queue draining toward them — and the rotation
  // index is the fallback for before the player has reported a position.
  // Nothing queued and not sitting out is its own state: idle, not armed. The
  // strip is on screen from the moment you walk in now — it carries the Battle
  // key — so this is the state most people see first, and it has to look like
  // an invitation rather than like a turn that is nearly up. Without it the
  // fallback below parks the meter at half and tints the strip standby teal,
  // which promises a turn to somebody who has not picked a song yet.
  // A place in the rotation counts as queued even when the caller passed no
  // count, so this asks both: idle is having nothing coming and nowhere to be.
  const isIdle = !isPaused && !isUpNow && songCount === 0 && !position

  const level = isPaused || isIdle
    ? 0
    : isUpNow
      ? 1
      : waitLevel ?? (position && rotationSize
        ? Math.max(0.06, 1 - (position - 1) / rotationSize)
        : 0.5)

  const headline = isPaused ? 'Paused' : isUpNow ? 'Now' : wait || '--'

  const label = isPaused
    ? 'you are out of the rotation'
    : isUpNow
      ? 'you are on stage'
      : nextSong ?? (position
        ? `${position} of ${rotationSize} in the rotation`
        : 'nothing queued')

  // Queued but not on stage is the same state the library gives a queued song:
  // "armed but not running", which the system says in standby teal. Amber is
  // for the channel that is actually live, so it waits until you are up. Idle
  // is neither — nothing is armed — so it stays on the plain faceplate.
  const isStandby = !isPaused && !isUpNow && !isIdle

  const pauseLabel = isPaused ? 'Resume my songs' : 'Pause my songs'

  const battleLabel = isBattleEnabled
    ? 'Challenge someone to a battle'
    : 'Battles are switched off for this room'

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

      {/* The song count and the Battle key are the same slot, and only one of
          them fits. Measured at 320px, which is where the strip already lives
          at its limit: headline ~108px for a Michroma "48 MIN", count ~49px,
          two 44px keys and four 10px gaps leave the meter 7px — it stops being
          a meter. Dropping the count for the key gives the meter 56px, which
          is *wider* than the 73px-minus-a-key it would otherwise have had. The
          count is also the least load-bearing thing in the strip: the headline
          already says the wait and the label already names the next song.
          ponytail: if the count turns out to be missed, the honest fix is a
          second row for the keys, not shaving the tap targets. */}
      {onBattle
        ? (
            /* variant='default' rather than bare, even though an icon-only key
               is allowed to go without one. Bare is what this system uses for
               the adjuncts you dismiss with — the × on a modal, the chevrons on
               the visualizer — while every control that is a *key* carries a
               variant and the raised face that comes with it. This one sits
               against the pause key in the same strip, so a flat glyph next to
               a raised key would read as half-drawn rather than as restraint. */
            <Button
              className={styles.battleKey}
              variant='default'
              icon='VERSUS'
              size={22}
              disabled={!isBattleEnabled}
              onClick={onBattle}
              aria-label={battleLabel}
              title={battleLabel}
            />
          )
        : (
            <div className={clsx('silkscreen', styles.songCount)}>
              {songCount}
              {' '}
              {songCount === 1 ? 'song' : 'songs'}
            </div>
          )}

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
