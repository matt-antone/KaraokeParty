import React from 'react'
import clsx from 'clsx'
import styles from './AnswerKey.css'

/**
 * Six states, in the order a key passes through them:
 *
 *   open     lit, still takeable
 *   chosen   lit and held down — the one you pressed, answering still open
 *   closed   dark — a key you did not press, and can no longer press
 *   correct  lit and ringed — the answer
 *   wrong    dark — not the answer, and not yours either
 *   missed   dark and still held down — not the answer, and yours
 *
 * `closed` and `missed` exist so a phone can always answer "which one did I
 * press?" without the guest holding it in their head: the moment you commit,
 * the other three go dark, and if you got it wrong yours stays down through
 * the reveal instead of vanishing into three identical dark keys.
 */
export type AnswerKeyState = 'open' | 'chosen' | 'closed' | 'correct' | 'wrong' | 'missed'

interface AnswerKeyProps {
  /** 0-3. Fixes the colour and the position, on every surface. */
  index: number
  /** The answer itself, on both surfaces now: a guest reads what they are
   *  choosing rather than looking up to find out. */
  label: string
  /** 'player' is sized for a room, 'pad' for a hand. */
  variant: 'player' | 'pad'
  state?: AnswerKeyState
  disabled?: boolean
  onClick?: () => void
}

/**
 * One of the four trivia answer keys, and the single place their appearance is
 * decided — the player screen and every phone render this same component, so
 * key 3 cannot come out amber in one place and indigo in the other.
 *
 * The answer is now written on the key itself, on both surfaces. The numeral
 * that used to sit beside it existed to bridge the phone to the screen, and
 * bridges nothing once the phone says "Saturn" too: a guest reads the key they
 * are pressing. Position and colour still separate the four from each other,
 * and neither carries the meaning alone — roughly one in twelve men cannot
 * separate red from green, and a phone in landscape moves the grid.
 */
const AnswerKey = ({ index, label, variant, state = 'open', disabled, onClick }: AnswerKeyProps) => (
  <button
    type='button'
    className={clsx(styles.key, styles[`k${index}`], styles[state], styles[variant])}
    disabled={disabled}
    onClick={onClick}
  >
    <span className={styles.label}>{label}</span>
  </button>
)

export default AnswerKey
