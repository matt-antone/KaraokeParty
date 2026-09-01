import React from 'react'

// The player's voice: Michroma, wide-tracked, amber or ink. Replaces the old
// rainbow per-character animation entirely — this brand shouts by being large.
export function PlayerHeadline ({ children, tone = 'ink', size = 'var(--display-l)', className, style }) {
  return (
    <div
      className={className}
      translate='no'
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: size,
        letterSpacing: '.1em',
        lineHeight: 1.1,
        textTransform: 'uppercase',
        color: tone === 'vu' ? 'var(--vu)' : 'var(--ink)',
        textShadow: '0 2px 12px rgba(0,0,0,.8)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
