import React from 'react'
import clsx from 'clsx'
import styles from './AnswerKey.css'

export type AnswerKeyState = 'open' | 'chosen' | 'correct' | 'wrong'

interface AnswerKeyProps {
  /** 0-3. Fixes both the colour and the numeral, on every surface. */
  index: number
  /** The answer itself. Shown on the player screen; the phone passes none,
   *  so a guest has to look up at the screen to know what they are choosing. */
  label?: string
  state?: AnswerKeyState
  disabled?: boolean
  onClick?: () => void
}

/**
 * One of the four trivia answer keys, and the single place their appearance is
 * decided — the player screen and every phone render this same component, so
 * key 3 cannot come out amber in one place and indigo in the other. That
 * agreement is the whole mechanism: the phone shows no answer text, and a
 * guest matches their key to the screen's.
 *
 * The match is carried three ways, not one: position in the 2x2 grid, the
 * numeral, and colour. Colour alone would not do — roughly one in twelve men
 * cannot separate red from green — and position alone would not survive a
 * phone held in landscape.
 */
const AnswerKey = ({ index, label, state = 'open', disabled, onClick }: AnswerKeyProps) => (
  <button
    type='button'
    className={clsx(styles.key, styles[`k${index}`], styles[state], label && styles.labelled)}
    disabled={disabled}
    onClick={onClick}
    aria-label={label ? undefined : `Answer ${index + 1}`}
  >
    <span className={styles.numeral}>{index + 1}</span>
    {label && <span className={styles.label}>{label}</span>}
  </button>
)

export default AnswerKey
