export interface PlayerHeadlineProps {
  /** Short. One to three words. Rendered uppercase. */
  children?: React.ReactNode
  /** 'ink' for names and titles, 'vu' for the thing the room should act on. */
  tone?: 'ink' | 'vu'
  /** Defaults to var(--display-l). Use var(--display-xl) for the countdown numeral. */
  size?: string | number
  className?: string
  style?: React.CSSProperties
}

export function PlayerHeadline (props: PlayerHeadlineProps): JSX.Element
