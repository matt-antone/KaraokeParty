import React, { useState } from 'react'
import { Icon } from '../core/Icon.jsx'

// A sub-module inside a Panel. Its header is a key; the chevron rotates rather than
// swapping glyph.
export function Accordion ({ heading, children, initialExpanded = false, className, style, contentStyle }) {
  const [isExpanded, setExpanded] = useState(initialExpanded)

  return (
    <div
      className={className}
      style={{ borderRadius: 'var(--radius-key)', overflow: 'hidden', background: 'var(--key-well)', boxShadow: 'var(--well)', ...style }}
    >
      <button
        type='button'
        aria-expanded={isExpanded}
        onClick={() => setExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--gap-3)',
          width: '100%',
          minHeight: 'var(--target)',
          padding: '0 var(--gap-3)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-m)',
          fontWeight: 'var(--weight-semibold)',
          textAlign: 'left',
          color: 'var(--ink)',
          background: 'var(--key-face)',
          border: 'none',
          boxShadow: 'var(--bevel)',
          cursor: 'pointer',
        }}
      >
        <span style={{ flex: 1, minWidth: 0 }}>{heading}</span>
        <Icon
          icon='CHEVRON_RIGHT'
          size={22}
          style={{
            flexShrink: 0,
            color: 'var(--ink-3)',
            transform: isExpanded ? 'rotate(90deg)' : 'none',
            transition: 'transform var(--dur-ui) var(--ease-key)',
          }}
        />
      </button>
      {isExpanded && <div style={{ padding: 'var(--gap-3)', ...contentStyle }}>{children}</div>}
    </div>
  )
}
