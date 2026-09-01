export interface SliderProps {
  min?: number
  max?: number
  step?: number
  value: number
  onChange?: (value: number) => void
  /** Accessible name, e.g. "Lyrics size". */
  label?: string
  className?: string
  style?: React.CSSProperties
}

export function Slider (props: SliderProps): JSX.Element
