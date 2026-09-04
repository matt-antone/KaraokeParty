import React from 'react'
import clsx from 'clsx'
import TriviaMark from 'components/TriviaMark/TriviaMark'
import styles from './QueueTriviaItem.css'

interface QueueTriviaItemProps {
  isCurrent: boolean
  isPlayed: boolean
}

/**
 * A trivia round's place in the queue.
 *
 * Deliberately not a QueueItem in a different costume: it has no singer, no
 * song, no star, no key and no swipe actions, so almost everything that row
 * does would have to be switched off. What the two do share is their height
 * and their edge, so the rotation still reads as one list.
 *
 * The row is the server's to manage — it appears when trivia is on and is
 * replaced after each round — so there is nothing here to act on. It answers
 * one question: when is the next round.
 */
const QueueTriviaItem = ({ isCurrent, isPlayed }: QueueTriviaItemProps) => (
  <div className={clsx(styles.shell, isCurrent && styles.current)}>
    <div className={clsx(styles.container, isPlayed && styles.spent)}>
      <div className={styles.iconWell}>
        <TriviaMark variant='glyph' isDim={isPlayed} className={styles.mark} />
      </div>

      <div className={styles.primary}>
        <div className={styles.title}>Trivia</div>
        <div className={clsx('silkscreen', styles.subtitle)}>
          {isCurrent ? 'question in play' : isPlayed ? 'round played' : 'music round'}
        </div>
      </div>

      {isCurrent && <div className={styles.now}>NOW</div>}
    </div>
  </div>
)

export default QueueTriviaItem
