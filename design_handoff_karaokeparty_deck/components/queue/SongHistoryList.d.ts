export interface SongHistoryItem {
  title: string
  artist?: string
  /** Pre-formatted and short, e.g. "Aug 29". */
  date?: string
  isStarred?: boolean
  starCount?: number
}

/**
 * @startingPoint section="Queue" subtitle="The singer's past songs, each re-queueable" viewport="700x260"
 */
export interface SongHistoryListProps {
  items?: SongHistoryItem[]
  /** Starring a sung song favourites it for a future party. It cannot be re-queued tonight. */
  onStar?: (item: SongHistoryItem) => void
  /** Overrides the default empty copy. */
  emptyText?: string
  className?: string
  style?: React.CSSProperties
}

export function SongHistoryList (props: SongHistoryListProps): JSX.Element
