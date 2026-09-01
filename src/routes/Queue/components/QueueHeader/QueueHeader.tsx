import React from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { setQueueTab, QueueTab } from 'store/modules/ui'
import Tabs from 'components/Tabs/Tabs'
import getMyUpcoming from '../../selectors/getMyUpcoming'
import getQueueSections from '../../selectors/getQueueSections'
import styles from './QueueHeader.css'

/**
 * Three interfaces, not three filters: Queue is the rotation, History is what
 * the room has sung, Me is the singer's own songs plus their history.
 *
 * Status is not repeated here — YourTurn carries it in the header on every
 * screen, so the pause key lives there rather than on the Me tab.
 */
const QueueHeader = () => {
  const dispatch = useAppDispatch()
  const tab = useAppSelector(state => state.ui.queueTab)
  const { played, upcoming } = useAppSelector(getQueueSections)
  const mine = useAppSelector(getMyUpcoming)

  return (
    <div className={styles.container}>
      <Tabs<QueueTab>
        active={tab}
        onChange={id => dispatch(setQueueTab(id))}
        tabs={[
          { id: 'queue', label: 'Queue', count: upcoming.length },
          { id: 'me', label: 'Me', count: mine.length },
          { id: 'history', label: 'History', count: played.length },
        ]}
      />
    </div>
  )
}

export default QueueHeader
