export interface AlphaPickerProps {
  /** Defaults to # then A-Z. */
  letters?: string[]
  active?: string
  onPick?: (letter: string) => void
  className?: string
  style?: React.CSSProperties
}

export function AlphaPicker (props: AlphaPickerProps): JSX.Element
