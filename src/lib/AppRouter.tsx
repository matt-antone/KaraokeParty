// This router renders <App/>, which reaches store/modules/user.ts, which
// imports this file back — but only via a dynamic import inside a thunk, so
// nothing here is read during module initialization.
import React from 'react'
import { createBrowserRouter } from 'react-router'
import App from 'components/App/App'

const basename = new URL(document.baseURI).pathname

const AppRouter = createBrowserRouter([
  // https://github.com/remix-run/react-router/issues/9422#issuecomment-1302564759
  { path: '*', element: <App /> },
], { basename })

export default AppRouter
