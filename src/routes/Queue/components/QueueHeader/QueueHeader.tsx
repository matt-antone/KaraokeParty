import React from 'react'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { setQueueTab, QueueTab } from 'store/modules/ui'
import { ensureState } from 'redux-optimistic-ui'
import Button from 'components/Button/Button'
import { setPaused } from '../../modules/queue'
import getMyUpcoming from '../../selectors/getMyUpcoming'
import getQueueSections from '../../selectors/getQueueSections'
import styles from './QueueHeader.css'

const QueueHeader = () => {
  const dispatch = useAppDispatch()
  const tab = useAppSelector(state => state.ui.queueTab)
  const userId = useAppSelector(state => state.user.userId)
  const { played, upcoming } = useAppSelector(getQueueSections)
  const mine = useAppSelector(getMyUpcoming)
  const isPaused = useAppSelector(state => ensureState(state.queue).pausedUserIds.includes(userId))

  const tabs: Array<{ id: QueueTab, label: string, count: number }> = [
    { id: 'queue', label: 'Queue', count: upcoming.length },
    { id: 'me', label: 'Me', count: mine.length },
    { id: 'history', label: 'History', count: played.length },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.tabRow} role='tablist'>
        {tabs.map(({ id, label, count }) => (
          <button
            key={id}
            type='button'
            role='tab'
            aria-selected={tab === id}
            className={clsx(styles.tab, tab === id && styles.tabActive)}
            onClick={() => dispatch(setQueueTab(id))}
          >
            {label}
            <span className={styles.tabCount}>{count}</span>
          </button>
        ))}
      </div>
      {tab === 'me' && (isPaused || mine.length > 0) && (
        <Button
          className={clsx(styles.pauseBtn, isPaused && styles.pauseBtnActive)}
          icon={isPaused ? 'PLAY' : 'PAUSE'}
          size={22}
          onClick={() => dispatch(setPaused({ isPaused: !isPaused }))}
        >
          {isPaused ? 'Resume my songs' : 'Pause my songs'}
        </Button>
      )}
    </div>
  )
}

export default QueueHeader
