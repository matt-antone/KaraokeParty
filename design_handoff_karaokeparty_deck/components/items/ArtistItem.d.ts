/**
 * @startingPoint section="Library" subtitle="Artist folder row, collapsed and open" viewport="700x200"
 */
export interface ArtistItemProps {
  name: string
  /** Silkscreened inside the folder glyph when collapsed. */
  songCount: number
  isExpanded?: boolean
  /** A song under this artist is starred: the folder lights amber. */
  hasStarredChild?: boolean
  /** A song under this artist is queued: the name goes amber. */
  hasUpcomingChild?: boolean
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
}

export function ArtistItem (props: ArtistItemProps): JSX.Element
