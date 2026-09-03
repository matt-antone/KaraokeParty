import React, { useRef } from 'react'
import { useMatch } from 'react-router'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import useResizeObserver from 'use-resize-observer'
// global stylesheets should be imported before any
// components that will import their own modular css
import '../../../styles/global.css'
import Button from 'components/Button/Button'
import Header from 'components/Header/Header'
import Navigation from 'components/Navigation/Navigation'
import Modal from 'components/Modal/Modal'
import TriviaDialog from 'components/TriviaDialog/TriviaDialog'
import Routes from '../Routes/Routes'
import { clearErrorMessage, setFooterHeight, setHeaderHeight } from 'store/modules/ui'

const CoreLayout = () => {
  const isPlayerRoute = useMatch('/player')
  const dispatch = useAppDispatch()
  const headerRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)

  // Published as CSS vars as well as to the store: routes that are plain
  // document flow (Account, Settings) clear the fixed chrome in CSS, so they
  // never size themselves in JS and stay correct at any viewport. The store
  // copies remain for the virtualized lists, which need real pixel heights.
  useResizeObserver({
    onResize: ({ height }) => {
      dispatch(setHeaderHeight(height))
      document.documentElement.style.setProperty('--header-h', `${height ?? 0}px`)
    },
    ref: headerRef,
  })

  useResizeObserver({
    onResize: ({ height }) => {
      dispatch(setFooterHeight(height))
      document.documentElement.style.setProperty('--nav-h', `${height ?? 0}px`)
    },
    ref: navRef,
  })

  const ui = useAppSelector(state => state.ui)
  const closeError = () => dispatch(clearErrorMessage())

  return (
    <>
      <Header ref={headerRef} />

      <Routes />

      {!isPlayerRoute && <Navigation ref={navRef} />}

      {/* the answer pad follows the guest across every tab, and never opens on
          the player itself — that screen is showing the question */}
      {!isPlayerRoute && <TriviaDialog />}

      {ui.isErrored && (
        <Modal
          title='Fault'
          onClose={closeError}
          buttons={<Button variant='primary' onClick={closeError}>OK</Button>}
        >
          <p style={{ WebkitUserSelect: 'text', userSelect: 'text' }}>
            {ui.errorMessage}
          </p>
        </Modal>
      )}
    </>
  )
}

export default CoreLayout
