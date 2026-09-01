import React from 'react'
import { RootState } from 'store/store'
import { useAppSelector } from 'store/hooks'
import getSearchResults from '../../selectors/getSearchResults'
import PaddedList from 'components/PaddedList/PaddedList'
import SongList from '../SongList/SongList'
import type { RowComponentProps } from 'react-window'

// estimate only: rows are measured once rendered (see PaddedList), because a
// song title always shows in full and a wrapped title makes the row taller
const ROW_HEIGHT_SONG_WITH_ARTIST = 62 // --row-song + --gap-2 margin

// stable identity: PaddedList keys its measurement cache off this function
const rowHeight = () => ROW_HEIGHT_SONG_WITH_ARTIST

interface SongResultsProps {
  ui: RootState['ui']
}

interface CustomRowProps {
  filterKeywords: string[]
  songsResult: number[]
}

// outside the component to keep the reference stable; react-window
// re-renders the whole list (breaking animations) when it changes
const RowComponent = ({
  index,
  style,
  filterKeywords,
  songsResult,
}: RowComponentProps<CustomRowProps>) => (
  <div style={style}>
    <SongList
      songIds={[songsResult[index]]}
      showArtist
      filterKeywords={filterKeywords}
    />
  </div>
)

const SongResults = ({ ui }: SongResultsProps) => {
  const filterStr = useAppSelector(state => state.library.filterStr)
  const { songsResult } = useAppSelector(getSearchResults)

  const filterKeywords = filterStr.trim() ? filterStr.trim().toLowerCase().split(' ') : []

  return (
    <PaddedList
      rowComponent={RowComponent}
      rowProps={{ filterKeywords, songsResult }}
      rowHeight={rowHeight}
      cacheKey={filterStr}
      numRows={songsResult.length}
      paddingTop={ui.headerHeight}
      paddingRight={4}
      paddingBottom={ui.footerHeight}
      height={ui.innerHeight}
    />
  )
}

export default SongResults
