import React, { useState, useRef } from 'react'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { setFilterStr, resetFilterStr, setTab, toggleFilterStarred, setFilterTag, SONG_FACETS, FILTER_FACETS } from '../../modules/library'
import getSearchResults, { getFacetValues } from '../../selectors/getSearchResults'
import Button from 'components/Button/Button'
import Icon from 'components/Icon/Icon'
import Tabs from 'components/Tabs/Tabs'
import styles from './LibraryHeader.css'

/**
 * The library's whole control surface, in three rows: search, facet keys, tabs.
 *
 * Facets used to be four native selects, each labelled with an emoji so they
 * fit on one row. They are latching keys now — a lit amber key shows its state
 * without being opened, which is what you want filtering one-handed in a dark
 * room, and it retires the emoji. The store still holds one value per facet
 * category, so each key carries an invisible native select for choosing among
 * a category's values; tapping a lit key's "any" option clears it.
 */
const LibraryHeader = () => {
  const dispatch = useAppDispatch()
  const { filterStr, filterStarred, filterTags, tab } = useAppSelector(state => state.library)
  const { artistsResult, songsResult } = useAppSelector(getSearchResults)
  const facetValues = useAppSelector(getFacetValues)

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

      <div className={styles.facetRow}>
        {FILTER_FACETS.map((facet) => {
          const i = SONG_FACETS.indexOf(facet)
          const values = facetValues[i]
          const active = filterTags[i]
          const isEmpty = values.length === 0

          return (
            <span
              key={facet}
              className={clsx(
                styles.facetKey,
                active && styles.facetKeyOn,
                isEmpty && !active && styles.facetKeyDisabled,
              )}
            >
              <span className={styles.facetLabel}>{active || facet}</span>
              <select
                className={styles.facetSelect}
                aria-label={facet}
                disabled={isEmpty}
                value={active}
                onChange={e => dispatch(setFilterTag({ index: i, value: e.target.value }))}
              >
                <option value=''>{`any ${facet}`}</option>
                {values.map(tag => <option key={tag} value={tag}>{tag}</option>)}
              </select>
            </span>
          )
        })}
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
