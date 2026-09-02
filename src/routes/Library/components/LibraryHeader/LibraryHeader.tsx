import React, { useState, useRef } from 'react'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { setFilterStr, resetFilterStr, setTab, toggleFilterStarred } from '../../modules/library'
import getSearchResults from '../../selectors/getSearchResults'
import Button from 'components/Button/Button'
import Icon from 'components/Icon/Icon'
import Tabs from 'components/Tabs/Tabs'
import styles from './LibraryHeader.css'

/**
 * The library's whole control surface, in two rows: search, tabs.
 */
const LibraryHeader = () => {
  const dispatch = useAppDispatch()
  const { filterStr, filterStarred, tab } = useAppSelector(state => state.library)
  const { artistsResult, songsResult } = useAppSelector(getSearchResults)

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

  return (
    <div className={styles.container}>
      <div className={styles.searchRow}>
        <Icon
          icon='MAGNIFIER'
          size={24}
          className={clsx(styles.magnifier, filterStr && styles.magnifierActive)}
        />
        <input
          type='search'
          className={styles.searchInput}
          placeholder='search'
          aria-label='Search the library'
          value={value}
          onChange={handleChange}
          ref={searchInput}
        />
        {filterStr && (
          <Button
            icon='CLEAR'
            size={24}
            aria-label='Clear search'
            onClick={clearSearch}
            className={styles.btnClear}
          />
        )}
        <button
          type='button'
          aria-label='Starred only'
          aria-pressed={filterStarred}
          className={clsx(styles.btnStar, filterStarred && styles.starActive)}
          onClick={() => dispatch(toggleFilterStarred())}
        >
          ★
        </button>
      </div>

      <div className={styles.tabRow}>
        <Tabs<'artists' | 'songs'>
          active={tab}
          onChange={id => dispatch(setTab(id))}
          tabs={[
            { id: 'artists', label: 'Artists', count: artistsResult.length },
            { id: 'songs', label: 'Songs', count: songsResult.length },
          ]}
        />
      </div>
    </div>
  )
}

export default LibraryHeader
