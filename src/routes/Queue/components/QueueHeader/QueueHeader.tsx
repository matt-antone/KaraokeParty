import React from 'react'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { setQueueTab, QueueTab } from 'store/modules/ui'
import getMyUpcoming from '../../selectors/getMyUpcoming'
import getQueueSections from '../../selectors/getQueueSections'
import styles from './QueueHeader.css'

const QueueHeader = () => {
  const dispatch = useAppDispatch()
  const tab = useAppSelector(state => state.ui.queueTab)
  const { played, upcoming } = useAppSelector(getQueueSections)
  const mine = useAppSelector(getMyUpcoming)

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
    </div>
  )
}

export default QueueHeader
