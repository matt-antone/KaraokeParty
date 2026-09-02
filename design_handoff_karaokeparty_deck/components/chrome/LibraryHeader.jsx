import React from 'react'
import { Button } from '../core/Button.jsx'
import { Icon } from '../core/Icon.jsx'
import { Tabs } from './Tabs.jsx'

// Search, facet keys, tabs. Facets are latching keys, not dropdowns: on a phone a
// key you can see the state of beats a select you have to open.
export function LibraryHeader ({
  query = '',
  onQueryChange,
  facets = [],
  activeFacets = [],
  onFacetToggle,
  starredOnly,
  onToggleStarred,
  tab = 'artists',
  onTabChange,
  artistCount = 0,
  songCount = 0,
  className,
  style,
}) {
  return (
    <div className={className} style={{ ...style }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--gap-2)',
        padding: 'var(--gap-2) var(--gap-4)',
      }}
      >
        <Icon icon='MAGNIFIER' size={24} style={{ color: query ? 'var(--vu)' : 'var(--ink-3)', flexShrink: 0 }} />
        <input
          type='search'
          placeholder='search'
          value={query}
          onChange={e => onQueryChange && onQueryChange(e.target.value)}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 'var(--target)',
            padding: 0,
            fontSize: 'var(--text-xl)',
            color: 'var(--ink)',
            background: 'transparent',
            boxShadow: 'none',
            borderRadius: 0,
          }}
        />
        {query && (
          <Button tone='flush' icon='CLEAR' iconSize={24} aria-label='Clear search' onClick={() => onQueryChange && onQueryChange('')} style={{ color: 'var(--vu)' }} />
        )}
        <Button
          tone='flush'
          aria-label='Starred only'
          aria-pressed={!!starredOnly}
          onClick={onToggleStarred}
          style={{ color: starredOnly ? 'var(--vu)' : 'var(--ink-5)', fontSize: 17 }}
        >
          ★
        </Button>
      </div>

      {facets.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--gap-2)', padding: '0 var(--gap-4) var(--gap-3)' }}>
          {facets.map((facet) => {
            const isOn = activeFacets.includes(facet)

            return (
              <button
                key={facet}
                type='button'
                aria-pressed={isOn}
                onClick={() => onFacetToggle && onFacetToggle(facet)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: 'var(--target)',
                  padding: '0 var(--gap-2)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-s)',
                  fontWeight: 'var(--weight-semibold)',
                  textTransform: 'capitalize',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  border: 'none',
                  borderRadius: 'var(--radius-key)',
                  cursor: 'pointer',
                  color: isOn ? 'var(--on-vu)' : 'var(--ink-3)',
                  background: isOn ? 'var(--key-face-vu)' : 'var(--key-well)',
                  boxShadow: isOn ? 'var(--bevel)' : 'var(--well)',
                }}
              >
                {facet}
              </button>
            )
          })}
        </div>
      )}

      <div style={{ padding: '0 var(--gap-4) var(--gap-3)' }}>
        <Tabs
          active={tab}
          onChange={onTabChange}
          tabs={[
            { id: 'artists', label: 'Artists', count: artistCount },
            { id: 'songs', label: 'Songs', count: songCount },
          ]}
        />
      </div>
    </div>
  )
}
