import React from 'react'
import { ensureState } from 'redux-optimistic-ui'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { toggleSongStarred } from 'store/modules/userStars'
import ButtonStar from 'components/ButtonStar/ButtonStar'
import Panel from 'components/Panel/Panel'
import { formatDate } from 'lib/dateTime'
import styles from './SongHistory.css'

const SongHistory = () => {
  const dispatch = useAppDispatch()
  const history = useAppSelector(state => state.user.history)
  const starredSongs = useAppSelector(state => ensureState(state.userStars).starredSongs)

  return (
    <Panel title='Song History'>
      {history.length === 0
        ? <p className={styles.empty}>Songs you sing all the way through will show up here.</p>
        : (
            <ul className={styles.list}>
              {history.map(({ songId, artist, title, dateSung }) => (
                <li key={songId} className={styles.item}>
                  <div className={styles.primary}>
                    <div className={styles.title}>{title}</div>
                    <div className={styles.artist}>{artist}</div>
                  </div>
                  <div className={styles.date}>{formatDate(new Date(dateSung * 1000))}</div>
                  <ButtonStar
                    onClick={() => dispatch(toggleSongStarred(songId))}
                    isStarred={starredSongs.includes(songId)}
                    count={0}
                  />
                </li>
              ))}
            </ul>
          )}
    </Panel>
  )
}

export default SongHistory
