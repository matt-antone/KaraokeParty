export interface KnobProps {
  /** 0-1. */
  value?: number
  onChange?: (value: number) => void
  /** Diameter in px. 34 in the transport. */
  size?: number
  /** Silkscreen label printed beside it, e.g. "vol". */
  label?: string
  className?: string
  style?: React.CSSProperties
}

export function Knob (props: KnobProps): JSX.Element
