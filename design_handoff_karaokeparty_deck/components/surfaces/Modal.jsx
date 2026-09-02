import React from 'react'
import { Button } from '../core/Button.jsx'

// A service panel that swings out over the chassis. Solid brushed face — not a blur;
// when you open a panel on a deck, you cannot see through it.
export function Modal ({ title, children, buttons, onClose, scrollable, className, style }) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'grid',
      placeItems: 'center',
      padding: 'var(--gap-4)',
      background: 'rgba(0,0,0,.66)',
      zIndex: 50,
    }}
    >
      <div
        role='dialog'
        aria-modal='true'
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: 480,
          maxHeight: '100%',
          background: 'var(--brush)',
          border: '1px solid var(--hairline)',
          borderRadius: 'var(--radius-panel)',
          boxShadow: '0 18px 50px -12px #000',
          overflow: 'hidden',
          ...style,
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--gap-3)',
          minHeight: 'var(--header-bar)',
          padding: '0 var(--gap-2) 0 var(--gap-4)',
          borderBottom: 'var(--hair-rule)',
        }}
        >
          <h2 style={{
            flex: 1,
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--silkscreen-size)',
            fontWeight: 'var(--weight-regular)',
            letterSpacing: 'var(--silkscreen-tracking)',
            textTransform: 'uppercase',
            color: 'var(--ink-2)',
          }}
          >
            {title}
          </h2>
          <Button tone='flush' icon='CLEAR' iconSize={24} onClick={onClose} aria-label='Close' />
        </div>

        <div style={{
          padding: 'var(--gap-4)',
          overflowY: scrollable ? 'auto' : undefined,
          WebkitOverflowScrolling: 'touch',
        }}
        >
          {children}
        </div>

        {buttons && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--gap-2)',
            padding: 'var(--gap-4)',
            borderTop: 'var(--hair-rule)',
          }}
          >
            {buttons}
          </div>
        )}
      </div>
    </div>
  )
}
