import type { IconName } from './Icon'

export interface SwipeAction {
  icon: IconName
  /** Printed under the glyph in silkscreen. One word: "Remove", "Skip", "Top". */
  label: string
  /** 'alert' = red key (destructive), 'vu' = amber key (constructive), 'panel' = graphite. */
  tone?: 'vu' | 'alert' | 'panel'
  onClick?: () => void
}

/**
 * @startingPoint section="Core" subtitle="Swipe a row aside to reveal the keys beneath it" viewport="700x220"
 */
export interface SwipeRowProps {
  /** Revealed under the row, right-aligned, in order. Two or three at most. */
  actions?: SwipeAction[]
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Match the row's own radius so the reveal is clipped to it. */
  radius?: string
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export const SWIPE_ACTION_WIDTH: number
export function SwipeRow (props: SwipeRowProps): JSX.Element
