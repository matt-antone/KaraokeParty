import React from 'react'

// A module bolted to the chassis. Brushed face, a silkscreened title strip with a
// hairline under it, and an optional control at the right of the strip.
export function Panel ({ title, titleComponent, children, className, style, contentStyle }) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--brush)',
        borderRadius: 'var(--radius-panel)',
        boxShadow: 'var(--bevel)',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--gap-3)',
        minHeight: 'var(--header-bar)',
        padding: '0 var(--gap-4)',
        borderBottom: 'var(--hair-rule)',
      }}
      >
        <h2 style={{
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
        {titleComponent}
      </div>
      <div style={{ padding: 'var(--gap-4)', ...contentStyle }}>{children}</div>
    </div>
  )
}
