import React, { useRef, useCallback } from 'react'

// Linear fader. A recessed track, an amber travelled section, and a machined cap.
// Used inside the Display modal; room volume uses a Knob instead.
export function Slider ({ min = 0, max = 1, step = 0.01, value, onChange, label, className, style, ...rest }) {
  const railRef = useRef(null)
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)))

  const setFromClientX = useCallback((clientX) => {
    const rail = railRef.current
    if (!rail || !onChange) return
    const rect = rail.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const raw = min + ratio * (max - min)
    onChange(Math.round(raw / step) * step)
  }, [min, max, step, onChange])

  return (
    <div
      ref={railRef}
      role='slider'
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={0}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setFromClientX(e.clientX) }}
      onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) setFromClientX(e.clientX) }}
      className={className}
      style={{
        position: 'relative',
        height: 'var(--target)',
        touchAction: 'pan-x',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'rgba(0,0,0,0)',
        ...style,
      }}
      {...rest}
    >
      <div style={{
        position: 'absolute',
        top: 'calc(50% - 4px)',
        left: 0,
        right: 0,
        height: 8,
        borderRadius: 4,
        background: 'var(--key-well)',
        boxShadow: 'var(--well)',
      }}
      />
      <div style={{
        position: 'absolute',
        top: 'calc(50% - 4px)',
        left: 0,
        width: `${pct * 100}%`,
        height: 8,
        borderRadius: 4,
        background: 'var(--vu)',
      }}
      />
      <div style={{
        position: 'absolute',
        top: 'calc(50% - 14px)',
        left: `${pct * 100}%`,
        transform: 'translateX(-50%)',
        width: 14,
        height: 28,
        borderRadius: 2,
        background: 'var(--key-face)',
        boxShadow: 'var(--bevel)',
        pointerEvents: 'none',
      }}
      />
    </div>
  )
}
