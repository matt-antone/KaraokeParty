import React, { useState, useRef, useMemo } from 'react'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { setFilterStr, resetFilterStr, toggleFilterStarred, setFilterTag, SONG_FACETS } from '../../modules/library'
import Button from 'components/Button/Button'
import styles from './LibraryHeader.css'

const LibraryHeader = () => {
  const dispatch = useAppDispatch()
  const { filterStr, filterStarred, filterTags } = useAppSelector(state => state.library)
  const songs = useAppSelector(state => state.songs)

  // distinct values present in the library, per facet position
  const facetValues = useMemo(
    () => SONG_FACETS.map((_, i) =>
      [...new Set(songs.result.map(songId => songs.entities[songId].tags[i]).filter(Boolean))].sort()),
    [songs],
  )

  const searchInput = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(filterStr)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value)
    dispatch(setFilterStr(event.target.value))
  }

  const clearSearch = () => {
    setValue('')
    dispatch(resetFilterStr())
  }

  const handleMagnifierClick = () => {
    if (value.trim()) clearSearch()
    else searchInput.current?.focus()
  }

  return (
    <div className={styles.container}>
      <div className={styles.searchRow}>
        <Button
          className={clsx(styles.btnMagnifier, filterStr && styles.active)}
          icon='MAGNIFIER'
          onClick={handleMagnifierClick}
        />
        <input
          type='search'
          className={styles.searchInput}
          placeholder='search'
          value={value}
          onChange={handleChange}
          ref={searchInput}
        />
        {filterStr && (
          <Button
            icon='CLEAR'
            onClick={clearSearch}
            className={clsx(styles.btnClear, styles.active)}
          />
        )}
        <Button
          className={clsx(styles.btnStar, filterStarred && styles.active)}
          icon='STAR_FULL'
          onClick={() => dispatch(toggleFilterStarred())}
        />
      </div>

      {facetValues.some(values => values.length > 0) && (
        <div className={styles.facetRow}>
          {SONG_FACETS.map((facet, i) => facetValues[i].length > 0 && (
            <select
              key={facet}
              className={clsx(styles.facetSelect, filterTags[i] && styles.activeSelect)}
              value={filterTags[i]}
              onChange={event => dispatch(setFilterTag({ index: i, value: event.target.value }))}
            >
              <option value=''>
                any
                {' '}
                {facet}
              </option>
              {facetValues[i].map(tag => <option key={tag} value={tag}>{tag}</option>)}
            </select>
          ))}
        </div>
      )}
    </div>
  )
}

export default LibraryHeader
