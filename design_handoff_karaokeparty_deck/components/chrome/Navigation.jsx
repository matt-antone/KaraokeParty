import React from 'react'
import { Icon } from '../core/Icon.jsx'

const TABS = [
  { id: 'library', icon: 'NAV_LIBRARY', label: 'Library' },
  { id: 'queue', icon: 'NAV_SUBSCRIPTIONS', label: 'Queue' },
  { id: 'account', icon: 'NAV_ACCOUNT', activeIcon: 'NAV_ACCOUNT_ACTIVE', label: 'Account' },
  { id: 'settings', icon: 'TUNE', label: 'Settings', adminOnly: true },
]

// Fixed bottom bar — the transport strip along the bottom of the chassis.
// Icons only; the lit one is amber.
export function Navigation ({ active, isAdmin, onNavigate, className, style }) {
  const tabs = TABS.filter(t => !t.adminOnly || isAdmin)

  return (
    <nav
      className={className}
      style={{
        display: 'flex',
        width: '100%',
        background: 'var(--brush)',
        boxShadow: 'var(--edge-bottom)',
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id

        return (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate(tab.id) }}
            style={{
              flex: 1,
              display: 'grid',
              placeItems: 'center',
              minHeight: 'var(--nav-bar)',
              color: isActive ? 'var(--vu)' : 'var(--ink-5)',
              borderTop: isActive ? '2px solid var(--vu)' : '2px solid transparent',
            }}
          >
            <Icon icon={isActive && tab.activeIcon ? tab.activeIcon : tab.icon} size={26} />
          </a>
        )
      })}
    </nav>
  )
}
