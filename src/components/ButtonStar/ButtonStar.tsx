import React from 'react'
import clsx from 'clsx'
import Button from 'components/Button/Button'
import styles from './ButtonStar.css'

interface ButtonStarProps {
  className?: string
  onClick: (e: React.MouseEvent) => void
  count: number
  isStarred: boolean
}

/**
 * Star a song. In every library row, every queue row, and the song-history
 * list — and the only control a played row keeps.
 *
 * A text star, never an emoji. Off is --ink-5 and reads as unlit; on is amber
 * and reads as lit, the same as every other indicator in the product. The
 * bounce it used to do on toggle is gone with the rest of the springy motion.
 */
const ButtonStar = ({ className, onClick, count, isStarred }: ButtonStarProps) => (
  <Button
    onClick={onClick}
    aria-label={isStarred ? 'unstar' : 'star'}
    aria-pressed={isStarred}
    className={clsx(styles.container, isStarred && styles.starred, className)}
  >
    <span className={styles.star}>★</span>
    {count > 0 && <span className={styles.starCount}>{count}</span>}
  </Button>
)

export default ButtonStar
