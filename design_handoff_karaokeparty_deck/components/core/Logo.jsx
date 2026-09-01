import React from 'react'

// Wordmark: KARAOKE in ink over PARTY in amber, stacked, Michroma, wide tracking —
// a stack of two channel labels silkscreened on a faceplate.
// Mark: a knob. Two concentric circles with an amber index line at twelve o'clock.
// Both are CSS geometry; there is no logo image and none should be drawn.
export function Mark ({ size = 40, className, style }) {
  return (
    <div
      className={className}
      aria-hidden
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 'var(--radius-round)',
        background: 'linear-gradient(145deg, #3a3d42, #1a1c1e)',
        boxShadow: 'var(--bevel)',
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
        ...style,
      }}
    >
      <div style={{
        width: size * 0.52,
        height: size * 0.52,
        borderRadius: 'var(--radius-round)',
        background: 'linear-gradient(145deg, #222427, #2f3237)',
        boxShadow: 'var(--well-deep)',
      }}
      />
      <div style={{
        position: 'absolute',
        top: size * 0.1,
        left: '50%',
        transform: 'translateX(-50%)',
        width: Math.max(2, size * 0.075),
        height: size * 0.2,
        borderRadius: 2,
        background: 'var(--vu)',
      }}
      />
    </div>
  )
}

export function Logo ({ size = 'var(--display-s)', withMark, markSize = 40, className, style }) {
  const word = (
    <div style={{ fontFamily: 'var(--font-display)', fontSize: size, letterSpacing: '.13em', lineHeight: 1.55 }}>
      KARAOKE
      <br />
      <span style={{ color: 'var(--vu)' }}>PARTY</span>
    </div>
  )

  if (!withMark) {
    return <div role='img' aria-label='KaraokeParty' className={className} style={style}>{word}</div>
  }

  return (
    <div
      role='img'
      aria-label='KaraokeParty'
      className={className}
      style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-3)', ...style }}
    >
      <Mark size={markSize} />
      {word}
    </div>
  )
}
