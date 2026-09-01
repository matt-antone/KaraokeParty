import React from 'react'
import clsx from 'clsx'
import styles from './CornerPanel.css'

interface CornerPanelProps {
  /** Printed above the name: 'on stage' or 'up next'. Uppercased by the panel. */
  label: string
  singer: string
  /** Amber for whoever is on stage now, ink for whoever is next. */
  tone?: 'ink' | 'vu'
  songTitle?: string
  songArtist?: string
}

// A solid panel in the top-right, keeping the lower two-thirds clear for lyrics.
// It always names the singer *and* their song — a name alone leaves the room
// guessing what is about to play.
const CornerPanel = ({ label, singer, tone = 'ink', songTitle, songArtist }: CornerPanelProps) => (
  <div className={styles.panel}>
    <div className={clsx('silkscreen', styles.label)}>{label}</div>
    <div className={clsx(styles.singer, tone === 'vu' && styles.vu)} translate='no'>{singer}</div>
    {songTitle && (
      <div className={styles.song} translate='no'>
        <div className={styles.title}>{songTitle}</div>
        {songArtist && <div className={styles.artist}>{songArtist}</div>}
      </div>
    )}
  </div>
)

export default CornerPanel
