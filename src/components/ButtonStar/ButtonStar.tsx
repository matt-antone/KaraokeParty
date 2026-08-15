import React from 'react'
import clsx from 'clsx'
import Button from 'components/Button/Button'
import ToggleAnimation from 'components/ToggleAnimation/ToggleAnimation'
import styles from './ButtonStar.css'

interface ButtonStarProps {
  className?: string
  onClick: (e: React.MouseEvent) => void
  count: number
  isStarred: boolean
}

const ButtonStar = ({
  className,
  onClick,
  count,
  isStarred,
}: ButtonStarProps) => {
  return (
    <Button
      onClick={onClick}
      aria-label={isStarred ? 'unstar' : 'star'}
      className={clsx(styles.container, isStarred && styles.starred, className)}
    >
      <ToggleAnimation toggle={isStarred} className={styles.animateStar}>
        <span className={styles.star}>⭐</span>
      </ToggleAnimation>
      {count > 0 && <span className={styles.starCount}>{count}</span>}
    </Button>
  )
}

export default ButtonStar
