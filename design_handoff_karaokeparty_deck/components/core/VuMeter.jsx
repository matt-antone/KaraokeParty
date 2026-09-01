import React from 'react'

// Segmented level meter. The system's signature element: it appears as room level
// in the transport, as queue depth on the player, and as scan progress in settings.
// Segments are wells that light amber; the top few light red.
export function VuMeter ({
  value = 0,
  segments = 24,
  peakFrom = 0.86,
  height = 12,
  vertical,
  className,
  style,
}) {
  const lit = Math.round(value * segments)

  return (
    <div
      className={className}
      role='meter'
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={value}
      style={{
        display: 'flex',
        flexDirection: vertical ? 'column-reverse' : 'row',
        gap: 'var(--gap-1)',
        width: vertical ? height : '100%',
        height: vertical ? '100%' : height,
        ...style,
      }}
    >
      {Array.from({ length: segments }, (_, i) => {
        const isLit = i < lit
        const isPeak = i / segments >= peakFrom
        const isHot = i / segments >= 0.55

        return (
          <i
            key={i}
            style={{
              flex: 1,
              borderRadius: 1,
              background: !isLit
                ? 'var(--key-well)'
                : isPeak
                  ? 'var(--alert)'
                  : isHot ? 'var(--vu)' : 'var(--vu-dim)',
              boxShadow: isLit ? 'none' : 'var(--well)',
            }}
          />
        )
      })}
    </div>
  )
}
