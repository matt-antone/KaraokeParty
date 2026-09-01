export interface ButtonStarProps {
  isStarred: boolean
  /** Stars from all singers combined. Hidden at 0. */
  count?: number
  onClick: (e: React.MouseEvent) => void
  className?: string
  style?: React.CSSProperties
}

export function ButtonStar (props: ButtonStarProps): JSX.Element
