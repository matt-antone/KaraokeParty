import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router'
import { useAppSelector } from 'store/hooks'

import AccountView from 'routes/Account/views/AccountView'
import LibraryView from 'routes/Library/views/LibraryView'
import QueueView from 'routes/Queue/views/QueueView'
import SettingsView from 'routes/Settings/views/SettingsView'

const PlayerView = React.lazy(() => import('routes/Player/views/PlayerView'))

const AppRoutes = () => (
  <Routes>
    <Route path='/account' element={<AccountView />} />
    <Route
      path='/settings'
      element={(
        <RequireAuth path='/settings' redirectTo='/account'>
          <SettingsView />
        </RequireAuth>
      )}
    />
    <Route
      path='/library'
      element={(
        <RequireAuth path='/library' redirectTo='/account'>
          <LibraryView />
        </RequireAuth>
      )}
    />
    <Route
      path='/queue'
      element={(
        <RequireAuth path='/queue' redirectTo='/account'>
          <QueueView />
        </RequireAuth>
      )}
    />
    <Route
      path='/player'
      element={(
        <RequireAuth path='/player' redirectTo='/account'>
          <PlayerView />
        </RequireAuth>
      )}
    />
    <Route
      path='/'
      element={(
        <Navigate
          to={{
            pathname: '/library',
            search: window.location.search, // pass through search params (e.g. roomId)
          }}
          replace
        />
      )}
    />
  </Routes>
)

export default AppRoutes

interface RequireAuthProps {
  children: React.ReactNode
  path: string
  redirectTo: string
}

const RequireAuth = ({
  children,
  path,
  redirectTo,
}: RequireAuthProps) => {
  const { isAdmin, userId } = useAppSelector(state => state.user)
  const location = useLocation()

  // signed out: sign in first (checked before the admin-only paths below so
  // the desired location isn't lost on the way to the sign-in view)
  if (userId === null) {
    // set their originally-desired location in query parameter
    const params = new URLSearchParams(location.search)
    params.set('redirect', path)

    return <Navigate to={redirectTo + '?' + params.toString()} replace />
  }

  if ((path === '/player' || path === '/settings') && !isAdmin) {
    return <Navigate to='/' replace />
  }

  return children
}
