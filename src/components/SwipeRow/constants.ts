import type Icon from 'components/Icon/Icon'
import type React from 'react'

/** Width of one revealed action key. */
export const SWIPE_ACTION_WIDTH = 72

/** Past this fraction of its travel, the row snaps open instead of back. */
export const SNAP_AT = 0.4

/** Horizontal movement before the gesture is a swipe rather than a scroll. */
export const CAPTURE_PX = 8

export interface SwipeAction {
  icon: React.ComponentProps<typeof Icon>['icon']
  /** Printed under the glyph in silkscreen. One word: "Remove", "Skip", "Top". */
  label: string
  /** alert = destructive, vu = constructive, panel = graphite. */
  tone?: 'vu' | 'alert' | 'panel'
  onClick?: () => void
}
