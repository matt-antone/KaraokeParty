import React from 'react'
import { Button } from './Button.jsx'

// Favourite toggle. A typographic star, not an emoji: off is --ink-5, on is amber.
export function ButtonStar ({ isStarred, count = 0, onClick, className, style }) {
  return (
    <Button
      tone='flush'
      onClick={onClick}
      aria-label={isStarred ? 'unstar' : 'star'}
      aria-pressed={!!isStarred}
      className={className}
      style={{ gap: 3, color: isStarred ? 'var(--vu)' : 'var(--ink-5)', ...style }}
    >
      <span style={{ fontSize: 15, lineHeight: 1 }}>★</span>
      {count > 0 && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          fontWeight: 'var(--weight-regular)',
          lineHeight: 1,
          pointerEvents: 'none',
        }}
        >
          {count}
        </span>
      )}
    </Button>
  )
}
