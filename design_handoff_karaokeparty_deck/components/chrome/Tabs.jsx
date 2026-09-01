import React from 'react'

// Channel selector. Keys sitting in a recessed track; the selected key is raised
// with an amber label.
export function Tabs ({ tabs, active, onChange, className, style }) {
  return (
    <div
      role='tablist'
      className={className}
      style={{
        display: 'flex',
        gap: 'var(--gap-1)',
        padding: 3,
        borderRadius: 'var(--radius-panel)',
        background: 'var(--key-well)',
        boxShadow: 'var(--well)',
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id

        return (
          <button
            key={tab.id}
            type='button'
            role='tab'
            aria-selected={isActive}
            onClick={() => onChange && onChange(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--gap-2)',
              flex: 1,
              minHeight: 'var(--target)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-s)',
              fontWeight: 'var(--weight-bold)',
              border: 'none',
              borderRadius: 'var(--radius-tab)',
              cursor: 'pointer',
              color: isActive ? 'var(--vu)' : 'var(--ink-3)',
              background: isActive ? 'var(--key-face)' : 'transparent',
              boxShadow: isActive ? 'var(--bevel)' : 'none',
            }}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 'var(--weight-regular)',
                opacity: 0.75,
              }}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
