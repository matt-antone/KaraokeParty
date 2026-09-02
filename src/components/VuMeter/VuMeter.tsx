import React from 'react'
import clsx from 'clsx'
import { clampValue, segmentState } from './segments'
import styles from './VuMeter.css'

interface VuMeterProps {
  /** 0-1. Values outside the range are clamped; NaN reads as 0. */
  value?: number
  /**
   * Segment count. A *visual* choice, not a data one: keep it high (14-30) so
   * the bar reads as a level. Never map segments 1:1 onto a small quantity —
   * a four-segment meter reads as four blocks, not a level.
   */
  segments?: number
  /**
   * Fraction of the scale above which segments light red instead of amber.
   * Pass a value above 1 to switch peaking off entirely, which is what every
   * non-audio meter wants: a scan reaching 90% is good news, not a fault.
   */
  peakFrom?: number
  /** Bar thickness in px. */
  height?: number
  /** Stack bottom-up instead of left-to-right. */
  vertical?: boolean
  /** Describes what is being measured, for assistive tech. */
  label?: string
  className?: string
  style?: React.CSSProperties
}

const VuMeter = ({
  value = 0,
  segments = 24,
  peakFrom = 0.86,
  height = 12,
  vertical,
  label,
  className,
  style,
}: VuMeterProps) => {
  const safe = clampValue(value)

  return (
    <div
      className={clsx(styles.container, vertical && styles.vertical, className)}
      role='meter'
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={safe}
      aria-label={label}
      style={{ '--vu-thickness': `${height}px`, ...style } as React.CSSProperties}
    >
      {Array.from({ length: segments }, (_, i) => {
        const state = segmentState(i, segments, safe, peakFrom)

        return (
          <i
            key={i}
            className={clsx(styles.seg, state !== 'off' && [
              styles.lit,
              state === 'peak' && styles.peak,
              state === 'hot' && styles.hot,
            ])}
          />
        )
      })}
    </div>
  )
}

export default VuMeter
