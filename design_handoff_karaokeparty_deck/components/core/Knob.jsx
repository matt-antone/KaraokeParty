import React, { useRef, useCallback } from 'react'

// Rotary control. Vertical drag turns it; the indicator line shows position over
// a 270-degree sweep. Used for room volume, where a horizontal slider would fight
// the list scroll on a phone.
export function Knob ({ value = 0, onChange, size = 34, label, className, style }) {
  const start = useRef(null)
  const angle = -135 + value * 270

  const onPointerDown = useCallback((e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { y: e.clientY, v: value }
  }, [value])

  const onPointerMove = useCallback((e) => {
    if (!start.current || !onChange) return
    const dv = (start.current.y - e.clientY) / 120
    onChange(Math.max(0, Math.min(1, start.current.v + dv)))
  }, [onChange])

  return (
    <div className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--gap-3)', ...style }}>
      <div
        role='slider'
        aria-label={label || 'Knob'}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={value}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => { start.current = null }}
        style={{
          position: 'relative',
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: 'var(--radius-round)',
          background: 'linear-gradient(145deg, #3d4046, #1c1e21)',
          boxShadow: 'var(--bevel)',
          cursor: 'ns-resize',
          touchAction: 'none',
        }}
      >
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          width: 2,
          height: '28%',
          borderRadius: 1,
          background: 'var(--vu)',
          transformOrigin: `50% ${size * 0.4}px`,
          transform: `translateX(-50%) rotate(${angle}deg)`,
        }}
        />
      </div>
      {label && <span className='silkscreen'>{label}</span>}
    </div>
  )
}
