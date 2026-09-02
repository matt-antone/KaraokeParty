export interface ProgressBarProps {
  /** 0-100. */
  pct?: number
  /** Current scanner line. Silkscreened and ellipsised. */
  text?: string
  /** Scan still running: the X turns red and cancels. */
  isActive?: boolean
  onCancel?: () => void
  onClose?: () => void
  className?: string
  style?: React.CSSProperties
}

export function ProgressBar (props: ProgressBarProps): JSX.Element
