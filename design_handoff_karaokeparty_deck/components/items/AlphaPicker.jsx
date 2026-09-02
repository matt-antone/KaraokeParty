import React from 'react'

const LETTERS = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')]

// Jump rail down the right edge of the artist list. Silkscreened, dim, sized in vh
// so the whole alphabet always fits.
export function AlphaPicker ({ letters = LETTERS, active, onPick, className, style }) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 30,
        flexShrink: 0,
        fontFamily: 'var(--font-mono)',
        fontSize: 'max(10px, 1.7vh)',
        color: 'var(--ink-5)',
        cursor: 'pointer',
        touchAction: 'none',
        ...style,
      }}
    >
      {letters.map(letter => (
        <span
          key={letter}
          onClick={() => onPick && onPick(letter)}
          style={{ color: letter === active ? 'var(--vu)' : undefined }}
        >
          {letter}
        </span>
      ))}
    </div>
  )
}
