import React from 'react'
import clsx from 'clsx'
import serverNow from 'lib/serverNow'
import useNow from 'lib/useNow'
import type { TriviaRound } from 'shared/types'
import styles from './TriviaRail.css'

interface TriviaRailProps {
  round: TriviaRound
  /** What this beat is — 'trivia', 'answer', 'scores'. The pad's own title bar
   *  already says it, so the pad passes none. */
  label?: string
  /** False once answering has closed: the clock and the bar go, because there
   *  is nothing left to be in time for. */
  isRunning?: boolean
  /** 'player' is sized for a room, 'pad' for a hand. */
  variant: 'player' | 'pad'
}

/**
 * The two marks a round is read by: how far through it is, and how long is
 * left. One component because the TV and every phone in the room count the
 * same round down, and a pad that says 4 while the screen says 6 is worse than
 * a pad with no clock at all.
 *
 * Same bargain AnswerKey makes: one component, both surfaces, and the only
 * thing the variant changes is scale.
 */
const TriviaRail = ({ round, label, isRunning, variant }: TriviaRailProps) => {
  const left = round.endsAt - serverNow(round, useNow())
  const secondsLeft = Math.max(0, Math.ceil(left / 1000))
  // `sentAt` is the moment the server opened answering, so the pair of stamps
  // is the whole countdown and the room's chosen duration is never sent.
  const remaining = Math.min(1, Math.max(0, left / Math.max(1, round.endsAt - round.sentAt)))

  return (
    <>
      <div className={clsx(styles.strip, styles[variant])}>
        {label && <div className={clsx('silkscreen', styles.label)}>{label}</div>}
        <div className={clsx('silkscreen', styles.progress)}>
          {`${round.questionNumber} of ${round.questionCount}`}
        </div>
        {isRunning && <div className={styles.clock}>{secondsLeft}</div>}
      </div>

      {/* Drains rather than ticks: the room can see time going without anyone
          having to read a numeral. Redrawn once a second by the same tick the
          numeral rides, so it steps the way a segment meter steps. */}
      {isRunning && (
        <div className={clsx(styles.timeBar, styles[variant])}>
          <div className={styles.timeFill} style={{ width: `${remaining * 100}%` }} />
        </div>
      )}
    </>
  )
}

export default TriviaRail
