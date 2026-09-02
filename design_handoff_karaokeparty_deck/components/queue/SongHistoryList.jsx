import React from 'react'
import { ButtonStar } from '../core/ButtonStar.jsx'

// The singer's own past performances. A sung song is locked for the rest of the party,
// so these rows carry no action that puts them back in the queue — they are a record.
// Rows are flat, with no key face, because nothing here is pressable except the star.
export function SongHistoryList ({ items = [], onStar, emptyText, className, style }) {
  if (items.length === 0) {
    return (
      <div className={className} style={{ padding: 'var(--gap-4)', ...style }}>
        <p className='silkscreen' style={{ margin: 0, letterSpacing: '.06em', lineHeight: 1.7 }}>
          {emptyText || 'Songs you sing all the way through show up here.'}
        </p>
      </div>
    )
  }

  return (
    <div className={className} style={style}>
      {items.map((item, i) => (
        <div
          key={`${item.title}-${i}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--gap-3)',
            minHeight: 'var(--target)',
            padding: 'var(--gap-2) var(--gap-4)',
            borderTop: i ? 'var(--seam-rule)' : 'none',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 'var(--text-m)',
              fontWeight: 'var(--weight-semibold)',
              lineHeight: 1.3,
              textWrap: 'pretty',
              color: 'var(--ink-2)',
            }}
            >
              {item.title}
            </div>
            <div
              className='silkscreen'
              style={{ letterSpacing: '.06em', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {item.artist}
            </div>
          </div>

          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', flexShrink: 0 }}>
            {item.date}
          </span>

          {/* the star is a favourite for a future party, not a re-queue */}
          <ButtonStar
            isStarred={!!item.isStarred}
            count={item.starCount || 0}
            onClick={() => onStar && onStar(item)}
          />
        </div>
      ))}
    </div>
  )
}
