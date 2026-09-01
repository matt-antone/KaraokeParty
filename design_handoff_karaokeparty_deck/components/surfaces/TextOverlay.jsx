import React from 'react'

// Empty state. A silkscreen headline and one line telling the singer what to press.
export function TextOverlay ({ title, children, className, style }) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: 'var(--gap-6) var(--gap-4)',
        textAlign: 'center',
        ...style,
      }}
    >
      <div>
        {title && (
          <h2 style={{
            margin: '0 0 var(--gap-3)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-s)',
            fontWeight: 'var(--weight-regular)',
            letterSpacing: 'var(--silkscreen-tracking)',
            textTransform: 'uppercase',
            color: 'var(--ink-2)',
          }}
          >
            {title}
          </h2>
        )}
        <div style={{ fontSize: 'var(--text-m)', color: 'var(--ink-3)', lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  )
}
