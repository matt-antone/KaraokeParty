/**
 * @startingPoint section="Brand" subtitle="Stacked wordmark and the knob mark" viewport="700x200"
 */
export interface LogoProps {
  /** Font size of the wordmark. Both lines scale from it. Default var(--display-s). */
  size?: string | number
  /** Show the knob mark to the left. */
  withMark?: boolean
  /** Mark diameter in px. */
  markSize?: number
  className?: string
  style?: React.CSSProperties
}

export interface MarkProps {
  /** Diameter in px. Minimum legible size is 24. */
  size?: number
  className?: string
  style?: React.CSSProperties
}

export function Logo (props: LogoProps): JSX.Element
export function Mark (props: MarkProps): JSX.Element
