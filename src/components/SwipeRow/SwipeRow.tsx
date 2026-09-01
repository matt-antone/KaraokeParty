import React, { useRef, useState } from 'react'
import clsx from 'clsx'
import Icon from 'components/Icon/Icon'
import { CAPTURE_PX, SNAP_AT, SWIPE_ACTION_WIDTH, type SwipeAction } from './constants'
import styles from './SwipeRow.css'

export interface SwipeRowProps {
  /** Revealed under the row, right-aligned, in order. Two or three at most —
   *  past that the row has to travel too far. */
  actions?: SwipeAction[]
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Match the row's own radius so the reveal is clipped to it. */
  radius?: string
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const SwipeRow = ({
  actions = [],
  isOpen,
  onOpenChange,
  radius = 'var(--radius-panel)',
  children,
  className,
  style,
}: SwipeRowProps) => {
  // derived from the action count, never measured: a row wired up while its
  // screen is hidden would measure 0 and cap its own travel at one key
  const span = actions.length * SWIPE_ACTION_WIDTH
  const [dragX, setDragX] = useState<number | null>(null)
  const start = useRef<{ x: number, y: number, base: number, captured: boolean, id: number } | null>(null)

  const open = !!isOpen
  const resting = open ? -span : 0
  const offset = dragX ?? resting

  const onPointerDown = (e: React.PointerEvent) => {
    if (!span) return
    start.current = { x: e.clientX, y: e.clientY, base: resting, captured: false, id: e.pointerId }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y

    // hand a vertical gesture back to the list so the page still scrolls
    if (!s.captured) {
      if (Math.abs(dy) > Math.abs(dx)) {
        start.current = null
        return
      }

      if (Math.abs(dx) < CAPTURE_PX) return
      s.captured = true
      e.currentTarget.setPointerCapture(s.id)
    }

    setDragX(Math.max(-span, Math.min(0, s.base + dx)))
  }

  const onPointerUp = () => {
    const s = start.current
    start.current = null
    if (!s?.captured) {
      setDragX(null)
      return
    }

    const settled = dragX ?? resting
    setDragX(null)
    onOpenChange?.(settled < -span * SNAP_AT)
  }

  return (
    <div
      className={clsx(styles.container, className)}
      style={{ borderRadius: radius, ...style }}
    >
      {span > 0 && (
        <div
          className={styles.actions}
          style={{ '--swipe-action-width': `${SWIPE_ACTION_WIDTH}px` } as React.CSSProperties}
        >
          {actions.map(action => (
            <button
              key={action.icon + action.label}
              type='button'
              aria-label={action.label}
              // not reachable by keyboard until the row is actually aside
              tabIndex={open ? 0 : -1}
              className={clsx(styles.action, styles[action.tone ?? 'panel'])}
              onClick={() => {
                onOpenChange?.(false)
                action.onClick?.()
              }}
            >
              <Icon icon={action.icon} size={24} />
              {action.label}
            </button>
          ))}
        </div>
      )}

      <div
        className={clsx(styles.slider, dragX != null && styles.dragging)}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {children}
      </div>
    </div>
  )
}

export default SwipeRow
