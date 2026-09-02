import type { SwipeAction } from '../core/SwipeRow'

export type QueueItemAction = SwipeAction

/**
 * @startingPoint section="Queue" subtitle="Rotation channel: playing, upcoming, played" viewport="700x330"
 */
export interface QueueItemProps {
  title: string
  artist?: string
  /** The singer, not the song's artist. */
  userDisplayName: string
  userImage?: string
  /** Pre-formatted wait badge on the avatar, e.g. "4 min". */
  wait?: string
  /** On stage now: the row becomes its own progress readout. */
  isCurrent?: boolean
  /** Audio actually running — drives the sweep. Pause it, don't remove it. */
  isPlaying?: boolean
  isPlayed?: boolean
  /** Singer paused their own songs. */
  isPaused?: boolean
  /** The viewer's own row: 2px amber rule down the left edge. */
  isOwner?: boolean
  isStarred?: boolean
  /** The row is swiped aside, showing its action keys. */
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  isUpcoming?: boolean
  starCount?: number
  /** 0-100. Clamped to a 2% minimum so a just-started song reads as started. */
  pctPlayed?: number
  /** Show the star. Off on the Me tab, where the list is your own songs and starring is not the job. */
  showStar?: boolean
  showDragHandle?: boolean
  actions?: QueueItemAction[]
  onStar?: () => void
  className?: string
  style?: React.CSSProperties
}

export function QueueItem (props: QueueItemProps): JSX.Element
