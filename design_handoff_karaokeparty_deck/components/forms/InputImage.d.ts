export interface InputImageProps {
  src?: string
  /** Square edge in px. 96 in forms. */
  size?: number
  onChange?: (file: File | undefined) => void
  onClear?: () => void
  className?: string
  style?: React.CSSProperties
}

export function InputImage (props: InputImageProps): JSX.Element
