/**
 * @startingPoint section="Library" subtitle="Search, facet keys, Artists/Songs tabs" viewport="700x220"
 */
export interface LibraryHeaderProps {
  query?: string
  onQueryChange?: (value: string) => void
  /** Facet values shown as latching keys, e.g. ['rock', '80s', 'belter']. */
  facets?: string[]
  activeFacets?: string[]
  onFacetToggle?: (facet: string) => void
  starredOnly?: boolean
  onToggleStarred?: () => void
  tab?: 'artists' | 'songs'
  onTabChange?: (tab: string) => void
  artistCount?: number
  songCount?: number
  className?: string
  style?: React.CSSProperties
}

export function LibraryHeader (props: LibraryHeaderProps): JSX.Element
