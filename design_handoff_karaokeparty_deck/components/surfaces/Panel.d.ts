/**
 * @startingPoint section="Surfaces" subtitle="Bolted-on module with a silkscreened title strip" viewport="700x260"
 */
export interface PanelProps {
  /** Silkscreened, so it renders uppercase and tracked. Write it in normal case. */
  title: string
  /** Control at the right of the title strip — in practice always a <select> filter. */
  titleComponent?: React.ReactNode
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  contentStyle?: React.CSSProperties
}

export function Panel (props: PanelProps): JSX.Element
