import React from 'react'
import clsx from 'clsx'
import styles from './TriviaTally.css'

interface TriviaTallyProps {
  /** How many of the room got the question. */
  numCorrect: number
  /** 'player' is sized for a room, 'pad' for a hand. */
  variant: 'player' | 'pad'
}

/**
 * How many got it, between questions.
 *
 * Same bargain TriviaRail and AnswerKey make: one component, both surfaces,
 * and the only thing the variant changes is scale.
 *
 * A number and nothing else. Naming everyone who got it made a list the room
 * had to read, on a beat that lasts three seconds — and put the people who
 * missed it on the TV, which is a different party.
 *
 * Zero needs no special case in the layout, but it does get its own face: a
 * party popper over a question the whole room missed is the screen laughing at
 * the wrong thing.
 */
const TriviaTally = ({ numCorrect, variant }: TriviaTallyProps) => (
  <div className={clsx(styles.tally, styles[variant])}>
    <div className={styles.party} aria-hidden='true'>{numCorrect ? '🎉' : '😬'}</div>
    <div className={styles.count}>{numCorrect}</div>
    <div className={clsx('silkscreen', styles.label)}>got it</div>
  </div>
)

export default TriviaTally
