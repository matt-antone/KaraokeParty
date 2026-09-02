import React, { useCallback, useRef, useState } from 'react'
import { Icon } from './Icon.jsx'

const TONES = {
  vu: { backgroundImage: 'var(--key-face-vu)', color: 'var(--on-vu)' },
  alert: { backgroundImage: 'var(--key-face-alert)', color: '#fff' },
  panel: { backgroundImage: 'var(--key-face)', color: 'var(--ink)' },
}

const ACTION_WIDTH = 72

// Swipe-to-reveal. The row slides sideways in one piece and the action keys are
// underneath it, bolted to the chassis — you are moving the cartridge aside to get
// at the panel behind it, not pulling a menu out of the row.
export function SwipeRow ({
  actions = [],
  isOpen,
  onOpenChange,
  radius = 'var(--radius-panel)',
  children,
  className,
  style,
}) {
  // derived from the action count, never measured: a row wired up while its screen is
  // hidden would measure 0 and cap its own travel at one key
  const span = actions.length * ACTION_WIDTH
  const [dragX, setDragX] = useState(null)
  const start = useRef(null)

  const open = !!isOpen
  const resting = open ? -span : 0
  const offset = dragX != null ? dragX : resting

  const setOpen = useCallback((next) => {
    if (onOpenChange) onOpenChange(next)
  }, [onOpenChange])

  const onPointerDown = (e) => {
    if (!span) return
    start.current = { x: e.clientX, y: e.clientY, base: resting, captured: false, id: e.pointerId }
  }

  const onPointerMove = (e) => {
    const s = start.current
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y

    // let a vertical gesture scroll the list instead
    if (!s.captured) {
      if (Math.abs(dy) > Math.abs(dx)) { start.current = null; return }
      if (Math.abs(dx) < 8) return
      s.captured = true
      e.currentTarget.setPointerCapture(s.id)
    }

    setDragX(Math.max(-span, Math.min(0, s.base + dx)))
  }

  const onPointerUp = () => {
    const s = start.current
    start.current = null
    if (!s || !s.captured) { setDragX(null); return }
    const settled = dragX != null ? dragX : resting
    setDragX(null)
    setOpen(settled < -span * 0.4)
  }

  return (
    <div
      className={className}
      style={{ position: 'relative', borderRadius: radius, overflow: 'hidden', ...style }}
    >
      {span > 0 && (
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, display: 'flex' }}>
          {actions.map(action => (
            <button
              key={action.icon + action.label}
              type='button'
              aria-label={action.label}
              tabIndex={open ? 0 : -1}
              onClick={() => { setOpen(false); if (action.onClick) action.onClick() }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                width: ACTION_WIDTH,
                border: 'none',
                borderLeft: '1px solid var(--chassis-deep)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                ...(TONES[action.tone] || TONES.panel),
              }}
            >
              <Icon icon={action.icon} size={24} />
              {action.label}
            </button>
          ))}
        </div>
      )}

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: 'relative',
          transform: `translateX(${offset}px)`,
          transition: dragX != null ? 'none' : `transform var(--dur-ui) var(--ease-key)`,
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export const SWIPE_ACTION_WIDTH = ACTION_WIDTH
