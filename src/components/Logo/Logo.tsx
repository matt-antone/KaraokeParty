import React from 'react'
import clsx from 'clsx'
import styles from './Logo.css'

interface LogoProps {
  className?: string
}

const Logo = (props: LogoProps) => (
  <div className={clsx(styles.container, props.className)} role='img' aria-label='KaraokeParty'>
    <span className={styles.title} aria-hidden='true'>
      Karaoke
      <span className={styles.subtitle}>Party</span>
    </span>
  </div>
)

export default Logo
