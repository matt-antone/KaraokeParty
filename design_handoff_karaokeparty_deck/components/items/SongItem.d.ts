/**
 * @startingPoint section="Library" subtitle="Song row: default, queued, played" viewport="700x280"
 */
export interface SongItemProps {
  title: string
  /** Omit inside an expanded artist folder. */
  artist?: string
  /** Genre first. Stored lowercase, displayed uppercase silkscreen, joined with " · ". */
  tags?: string[]
  /** Pre-formatted, e.g. "4:19". */
  duration?: string
  /** Already sung this party: the key face is removed and text dims. */
  isPlayed?: boolean
  /** In the queue: teal standby well, row inert, actions replaced by a QUEUED tag. */
  isUpcoming?: boolean
  isStarred?: boolean
  numStars?: number
  onQueue?: () => void
  onStar?: () => void
  className?: string
  style?: React.CSSProperties
}

export function SongItem (props: SongItemProps): JSX.Element
