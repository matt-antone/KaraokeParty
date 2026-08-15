import React, { useState } from 'react'
import { useAppSelector } from 'store/hooks'
import { Link } from 'react-router'
import ArtistList from '../components/ArtistList/ArtistList'
import SearchResults from '../components/SearchResults/SearchResults'
import SongResults from '../components/SongResults/SongResults'
import TextOverlay from 'components/TextOverlay/TextOverlay'
import Spinner from 'components/Spinner/Spinner'
import styles from './LibraryView.css'

const LibraryView = () => {
  const { isAdmin } = useAppSelector(state => state.user)
  const { isLoading, filterStr, filterStarred, filterTags, tab } = useAppSelector(state => state.library)
  const songsResult = useAppSelector(state => state.songs.result)
  const ui = useAppSelector(state => state.ui)

  const isSearching = !!filterStr.trim().length || filterStarred || filterTags.some(Boolean)
  const [initialHeaderHeight] = useState(ui.headerHeight)
  const [finalHeaderHeight, setFinalHeaderHeight] = useState(null)

  // don't render ArtistList until headerHeight is stable; otherwise
  // scroll position restoration does not work well (appears OBO)
  // @todo - this is hacky
  if (finalHeaderHeight === null && ui.headerHeight > initialHeaderHeight) {
    setFinalHeaderHeight(ui.headerHeight)
  }

  if (!finalHeaderHeight) return null

  return (
    <>
      {tab === 'songs' && <SongResults ui={ui} />}

      {tab === 'artists' && !isSearching && <ArtistList ui={ui} />}

      {tab === 'artists' && isSearching && <SearchResults ui={ui} />}

      {isLoading && <Spinner />}

      {!isLoading && songsResult.length === 0 && (
        <TextOverlay className={styles.empty}>
          <h1>Library Empty</h1>
          {isAdmin && (
            <p>
              <Link to='/settings'>Add media folders</Link>
              {' '}
              to get started.
            </p>
          )}
        </TextOverlay>
      )}
    </>
  )
}

export default LibraryView
