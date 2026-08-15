import React, { useState, useRef } from 'react'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { setFilterStr, resetFilterStr, setTab, toggleFilterStarred, setFilterTag, SONG_FACETS, FILTER_FACETS } from '../../modules/library'
import getSearchResults, { getFacetValues } from '../../selectors/getSearchResults'
import Button from 'components/Button/Button'
import styles from './LibraryHeader.css'

// each facet gets an emoji so all of them fit on one row
const FACET_EMOJI: Record<string, string> = {
  genre: '🎵',
  subgenre: '♪',
  decade: '📅',
  vibe: '✨',
}

const LibraryHeader = () => {
  const dispatch = useAppDispatch()
  const { filterStr, filterStarred, filterTags, tab } = useAppSelector(state => state.library)
  const { artistsResult, songsResult } = useAppSelector(getSearchResults)
  const facetValues = useAppSelector(getFacetValues)
  const hasFilterTags = filterTags.some(Boolean)

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
        <button
          type='button'
          aria-label='starred only'
          className={clsx(styles.btnStar, filterStarred && styles.starActive)}
          onClick={() => dispatch(toggleFilterStarred())}
        >
          <span>⭐</span>
        </button>
      </div>

      <div className={styles.facetRow}>
        {FILTER_FACETS.map((facet) => {
          const i = SONG_FACETS.indexOf(facet)

          return (
            <select
              key={facet}
              aria-label={facet}
              className={styles.facetSelect}
              disabled={facetValues[i].length === 0}
              value={filterTags[i]}
              onChange={event => dispatch(setFilterTag({ index: i, value: event.target.value }))}
            >
              <option value=''>
                {FACET_EMOJI[facet] ?? '🏷️'}
                {' '}
                All
              </option>
              {facetValues[i].map(tag => (
                <option key={tag} value={tag}>
                  {FACET_EMOJI[facet] ?? '🏷️'}
                  {' '}
                  {tag}
                </option>
              ))}
            </select>
          )
        })}
        <Button
          icon='CLEAR'
          aria-label='reset filters'
          className={clsx(styles.btnReset, hasFilterTags && styles.resetActive)}
          disabled={!hasFilterTags}
          onClick={() => filterTags.forEach((_, i) => dispatch(setFilterTag({ index: i, value: '' })))}
        />
      </div>

      <div className={styles.tabRow} role='tablist'>
        <button
          type='button'
          role='tab'
          aria-selected={tab === 'artists'}
          className={clsx(styles.tab, tab === 'artists' && styles.tabActive)}
          onClick={() => dispatch(setTab('artists'))}
        >
          Artists
          <span className={styles.tabCount}>{artistsResult.length}</span>
        </button>
        <button
          type='button'
          role='tab'
          aria-selected={tab === 'songs'}
          className={clsx(styles.tab, tab === 'songs' && styles.tabActive)}
          onClick={() => dispatch(setTab('songs'))}
        >
          Songs
          <span className={styles.tabCount}>{songsResult.length}</span>
        </button>
      </div>
    </div>
  )
}

export default LibraryHeader
