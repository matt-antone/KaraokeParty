import React, { useState, useEffect, useRef } from 'react'
import { CSSTransition } from 'react-transition-group'
import type { QueueItem } from 'shared/types'
import styles from './UpNow.css'

interface UpNowProps {
  queueItem: QueueItem
}

const UpNow = ({ queueItem }: UpNowProps) => {
  const [show, setShow] = useState(true)
  const nodeRef = useRef<HTMLDivElement | null>(null)

  // shown on mount via `appear` (the parent keys us on queueId): requestAnimationFrame
  // doesn't run while the player's tab is hidden, so gating the reveal on one could
  // outlive the timer that hides it, leaving the overlay stuck up for the whole song
  useEffect(() => {
    const timeoutID = setTimeout(() => setShow(false), 5000)
    return () => clearTimeout(timeoutID)
  }, [])

  return (
    <CSSTransition
      appear
      nodeRef={nodeRef}
      in={show}
      timeout={500}
      classNames={{
        appearActive: styles.enterActive,
        appearDone: styles.enterDone,
        enterActive: styles.enterActive,
        enterDone: styles.enterDone,
        exitActive: styles.exitActive,
      }}
    >
      <div ref={nodeRef} className={styles.container} translate='no'>
        <div className={styles.innerContainer}>
          <div className={styles.user}>
            {queueItem.userDisplayName}
          </div>
        </div>
      </div>
    </CSSTransition>
  )
}

export default UpNow
