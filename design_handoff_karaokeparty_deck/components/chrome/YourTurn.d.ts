/**
 * @startingPoint section="Chrome" subtitle="Your Turn — the app header's channel strip" viewport="700x300"
 */
export interface YourTurnProps {
  /** This singer is on stage right now. */
  isUpNow?: boolean
  /** Pre-formatted wait until their next song, e.g. "4 min". */
  wait?: string
  /** Their place in the rotation, 1-based. */
  position?: number
  /** How many singers are in the rotation. Used for the label and to scale the meter's value — the meter itself is always 24 segments. */
  rotationSize?: number
  /** How many songs they have queued. */
  songCount?: number
  /** They have stepped out of the rotation. */
  isPaused?: boolean
  onTogglePaused?: () => void
  className?: string
  style?: React.CSSProperties
}

export function YourTurn (props: YourTurnProps): JSX.Element
