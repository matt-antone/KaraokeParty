import React from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { ensureState } from 'redux-optimistic-ui'
import SongItem from '../SongItem/SongItem'
import { queueSong, removeItem } from 'routes/Queue/modules/queue'
import { toggleSongStarred } from 'store/modules/userStars'
import getSongsStatus from '../../selectors/getSongsStatus'

interface SongListProps {
  filterKeywords?: string[]
  showArtist: boolean
  songIds: number[]
}

const SongList = (props: SongListProps) => {
  const dispatch = useAppDispatch()
  const artists = useAppSelector(state => state.artists.entities)
  const songs = useAppSelector(state => state.songs.entities)
  const starredSongs = useAppSelector(state => ensureState(state.userStars).starredSongs)
  const starredSongCounts = useAppSelector(state => state.starCounts.songs)
  const isAdmin = useAppSelector(state => state.user.isAdmin)
  const { played, upcoming, current, mine } = useAppSelector(getSongsStatus)

  const handleSongQueue = (songId: number) => dispatch(queueSong(songId))
  const handleSongDequeue = (queueId: number) => dispatch(removeItem({ queueId }))
  const handleSongStar = (songId: number) => dispatch(toggleSongStarred(songId))

  return props.songIds.map(songId => (
    <SongItem
      {...songs[songId]}
      artist={props.showArtist ? artists[songs[songId].artistId].name : ''}
      filterKeywords={props.filterKeywords}
      isPlayed={played.includes(songId)}
      isUpcoming={upcoming.includes(songId) || current === songId}
      myQueueId={mine[songId]}
      isStarred={starredSongs.includes(songId)}
      isAdmin={isAdmin}
      key={songId}
      numStars={starredSongCounts[songId] || 0}
      onSongQueue={handleSongQueue}
      onSongDequeue={handleSongDequeue}
      onSongStarClick={handleSongStar}
    />
  ))
}

export default SongList
