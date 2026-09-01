import React from 'react'
import { Icon } from '../core/Icon.jsx'

// A library folder. The count is silkscreened inside the folder glyph; open swaps
// it for a chevron. A starred child lights the folder amber.
export function ArtistItem ({ name, songCount, isExpanded, hasStarredChild, hasUpcomingChild, onClick, className, style }) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-expanded={!!isExpanded}
      className={className}
      translate='no'
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--gap-3)',
        width: '100%',
        minHeight: 'var(--row-artist)',
        padding: 0,
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        borderBottom: 'var(--seam-rule)',
        cursor: 'pointer',
        ...style,
      }}
    >
      <div style={{
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        color: hasStarredChild ? 'var(--vu)' : 'var(--ink-5)',
      }}
      >
        <Icon icon='FOLDER' size={28} />
        <span style={{
          position: 'absolute',
          top: '54%',
          transform: 'translateY(-50%)',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: hasStarredChild ? 'var(--on-vu)' : 'var(--ink)',
        }}
        >
          {isExpanded ? '' : songCount}
        </span>
        {isExpanded && (
          <Icon icon='CHEVRON_DOWN' size={18} style={{ position: 'absolute', color: hasStarredChild ? 'var(--on-vu)' : 'var(--ink)' }} />
        )}
      </div>
      <span style={{
        flex: 1,
        minWidth: 0,
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-xl)',
        fontWeight: 'var(--weight-medium)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: hasUpcomingChild ? 'var(--vu)' : 'var(--ink)',
      }}
      >
        {name}
      </span>
    </button>
  )
}
