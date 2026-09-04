import React from 'react'
import clsx from 'clsx'
import { NavLink } from 'react-router'
import Icon from 'components/Icon/Icon'
import { useAppSelector } from 'store/hooks'
import styles from './Navigation.css'

/**
 * The bottom nav. There is no Player entry: the player is a room fixture the
 * host sets up once, and everything about it lives in Settings > Player.
 */
const NAV = [
  { to: '/library', icon: 'NAV_LIBRARY', label: 'Library', adminOnly: false },
  { to: '/queue', icon: 'NAV_SUBSCRIPTIONS', label: 'Queue', adminOnly: false },
  { to: '/account', icon: 'NAV_ACCOUNT', label: 'My Account', adminOnly: false },
  { to: '/settings', icon: 'TUNE', label: 'Settings', adminOnly: true },
] as const

const Navigation = () => {
  const isAdmin = useAppSelector(state => state.user.isAdmin)

  return (
    <div className={styles.container}>
      {NAV.filter(({ adminOnly }) => !adminOnly || isAdmin).map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          replace
          aria-label={label}
          className={({ isActive }) => clsx(isActive && styles.active)}
        >
          {({ isActive }) => (
            <span>
              <Icon
                icon={icon === 'NAV_ACCOUNT' && isActive ? 'NAV_ACCOUNT_ACTIVE' : icon}
                size={26}
              />
            </span>
          )}
        </NavLink>
      ))}
    </div>
  )
}

export default Navigation
