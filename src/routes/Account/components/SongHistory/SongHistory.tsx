import React from 'react'
import { ensureState } from 'redux-optimistic-ui'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { toggleSongStarred } from 'store/modules/userStars'
import Panel from 'components/Panel/Panel'
import SongHistoryList, { type SongHistoryDisplayItem } from 'components/SongHistoryList/SongHistoryList'
import { formatShortDate } from 'lib/dateTime'
import styles from './SongHistory.css'

const SongHistory = () => {
  const dispatch = useAppDispatch()
  const history = useAppSelector(state => state.user.history)
  const starredSongs = useAppSelector(state => ensureState(state.userStars).starredSongs)
  const starCounts = useAppSelector(state => state.starCounts)

  const items: SongHistoryDisplayItem[] = history.map(({ songId, artist, title, dateSung }) => ({
    songId,
    artist,
    title,
    date: formatShortDate(new Date(dateSung * 1000)),
    isStarred: starredSongs.includes(songId),
    starCount: starCounts.songs[songId] || 0,
  }))

  return (
    <Panel title='Song History' contentClassName={styles.content}>
      <SongHistoryList
        items={items}
        onStar={item => dispatch(toggleSongStarred(item.songId))}
      />
    </Panel>
  )
}

export default SongHistory
