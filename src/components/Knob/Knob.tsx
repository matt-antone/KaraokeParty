import React, { useRef } from 'react'
import clsx from 'clsx'
import styles from './Knob.css'

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

/** Vertical travel, in px, for the full 0-1 sweep. */
const DRAG_RANGE = 120
const clamp = (value: number) => Math.max(0, Math.min(1, value))

/**
 * Turned by dragging UP and DOWN, deliberately not sideways: it sits in a header
 * above a horizontally-swiped list, and a sideways drag belongs to the list.
 * Pair it with a VuMeter — the knob is the input, the meter is the readout.
 * Only ever one knob on a screen.
 */
const Knob = ({ value = 0, onChange, size = 34, label, className, style }: KnobProps) => {
  const drag = useRef<{ y: number, value: number } | null>(null)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { y: e.clientY, value }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !onChange) return
    onChange(clamp(drag.current.value + (drag.current.y - e.clientY) / DRAG_RANGE))
  }

  const handlePointerUp = () => {
    drag.current = null
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onChange) return

    const step = e.shiftKey ? 0.01 : 0.05
    const next = {
      ArrowUp: value + step,
      ArrowRight: value + step,
      ArrowDown: value - step,
      ArrowLeft: value - step,
      PageUp: value + 0.1,
      PageDown: value - 0.1,
      Home: 0,
      End: 1,
    }[e.key]

    if (next === undefined) return

    e.preventDefault()
    onChange(clamp(next))
  }

  const safe = clamp(Number.isNaN(value) ? 0 : value)

  return (
    <div className={clsx(styles.container, className)} style={style}>
      <div
        className={styles.knob}
        role='slider'
        aria-label={label || 'Knob'}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={safe}
        aria-valuetext={`${Math.round(safe * 100)}%`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          '--knob-size': `${size}px`,
          '--knob-angle': `${-135 + safe * 270}deg`,
        } as React.CSSProperties}
      >
        <div className={styles.cap} />
        <div className={styles.index} />
      </div>
      {label && <span className='silkscreen'>{label}</span>}
    </div>
  )
}

export default Knob
