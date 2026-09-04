import React, { useState } from 'react'
import Button from 'components/Button/Button'
import styles from './InstallHint.css'

const DISMISSED_KEY = 'installHintDismissed'

/**
 * iOS has no beforeinstallprompt, so there is no install button to offer and
 * no way to detect that the browser considers the app installable. Telling the
 * guest where the Share item is, once, is the only install path there is.
 *
 * Scoped to Safari on iOS because the wording is: Chrome, Firefox and Edge on
 * iOS cannot add a web app to the home screen at all, and every other platform
 * either has its own install affordance or a different menu.
 */
const isIosSafari = () => {
  const ua = navigator.userAgent
  // iPadOS 13+ reports itself as Macintosh; touch points are what separate an
  // iPad from a desktop Safari, which has no Add to Home Screen
  const isIos = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  return isIos && !/CriOS|FxiOS|EdgiOS/.test(ua)
}

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/

/**
 * Whether the address this page was loaded from is worth freezing.
 *
 * An install captures the URL it was added from and a standalone window has no
 * address bar to correct it, so an icon added from a raw IP is dead as soon as
 * the server moves network or its DHCP lease renews — and since private ranges
 * are heavily reused, it may reach an unrelated device rather than fail
 * cleanly. Better to never invite the install than to hand out an icon that
 * expires. The host opts in by giving the server a name (see KES_SERVER_URL).
 *
 * location.hostname rather than prefs.serverUrl: the latter is what the join QR
 * will hand out next, which is a different question from how this guest
 * actually arrived, and guests are not sent it anyway.
 */
const isDurableOrigin = () => {
  const { hostname } = window.location
  // IPv6 literals arrive bracketed, e.g. [fe80::1]
  return !IPV4.test(hostname) && !hostname.includes(':') && !hostname.startsWith('[')
}

// display-mode is the standard signal but only reached Safari in iOS 16.4;
// navigator.standalone is all an older iPhone has.
const isInstalled = () => window.matchMedia('(display-mode: standalone)').matches
  || (navigator as Navigator & { standalone?: boolean }).standalone === true

// Safari can throw rather than return null on storage access, and a hint that
// crashes the app it is advertising is worse than one that reappears.
const wasDismissed = () => {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

const InstallHint = () => {
  const [isShown, setIsShown] = useState(() =>
    isIosSafari() && isDurableOrigin() && !isInstalled() && !wasDismissed())

  if (!isShown) return null

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      // dismissal just won't survive a reload
    }
    setIsShown(false)
  }

  return (
    <div className={styles.container} role='note'>
      <p className={styles.copy}>
        <b className={styles.title}>Add to Home Screen</b>
        Tap Share in Safari, then Add to Home Screen.
      </p>
      <Button
        aria-label='Dismiss'
        className={styles.dismiss}
        icon='CLEAR'
        onClick={dismiss}
      />
    </div>
  )
}

export default InstallHint
