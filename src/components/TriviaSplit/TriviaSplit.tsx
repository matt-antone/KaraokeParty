import React from 'react'
import clsx from 'clsx'
import type { TriviaAnswered } from 'shared/types'
import styles from './TriviaSplit.css'

/** Correct first: it is the column to be in, and the room reads left to right. */
const COLUMNS = [true, false]

interface TriviaSplitProps {
  /** Everyone who answered the question, in the order they answered it. */
  answered: TriviaAnswered[]
  /** Marks one name as yours. The TV has nobody to mark. */
  userId?: number
  /** 'player' is sized for a room, 'pad' for a hand. */
  variant: 'player' | 'pad'
}

/**
 * Who got the question, in two columns.
 *
 * Same bargain TriviaRail and AnswerKey make: one component, both surfaces,
 * and the only thing the variant changes is scale. The room and the phones are
 * reading the same split of the same question, and a pad that sorted people
 * differently from the TV would be worse than a pad with no split at all.
 *
 * Both columns are always drawn, empty or not — a round nobody got wrong
 * should read as an empty right-hand column, not as a screen with one column
 * on it.
 */
const TriviaSplit = ({ answered, userId, variant }: TriviaSplitProps) => (
  <div className={clsx(styles.split, styles[variant])}>
    {COLUMNS.map((isCorrect) => {
      const label = isCorrect ? 'correct' : 'wrong'
      const names = answered.filter(a => a.isCorrect === isCorrect)

      return (
        <div key={label} className={clsx(styles.column, styles[label])}>
          <div className={clsx('silkscreen', styles.columnHeading)}>
            {`${label} ${String(names.length).padStart(2, '0')}`}
          </div>
          {names.map(a => (
            <div
              key={a.userId}
              className={clsx(styles.answeredName, a.userId === userId && styles.mine)}
              translate='no'
            >
              {a.name}
            </div>
          ))}
        </div>
      )
    })}
  </div>
)

export default TriviaSplit
