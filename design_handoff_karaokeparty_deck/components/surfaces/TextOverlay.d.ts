export interface TextOverlayProps {
  /** Silkscreened, rendered uppercase. Write it in normal case: "Queue Empty". */
  title?: string
  /** One sentence, with the destination as an inline link. */
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function TextOverlay (props: TextOverlayProps): JSX.Element
