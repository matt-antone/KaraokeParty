import React, { useState } from 'react'
import clsx from 'clsx'
import Button from 'components/Button/Button'
import Modal from 'components/Modal/Modal'
import { clampKeyChange, KEY_CHANGE_MAX } from 'shared/types'
import { formatKeyChange } from './formatKeyChange'
import styles from './SongSettings.css'

interface SongSettingsProps {
  artist: string
  keyChange: number
  title: string
  onChangeKey(keyChange: number): void
  onClose(): void
}

/**
 * Per-entry settings for one queued song. Key is the only one so far, but the
 * dialog is the right shape for the note-to-host and tempo controls that come
 * next — a second gear would have nowhere to go.
 *
 * The key belongs to the queue entry, not the song: two singers can hold the
 * same track at different keys in the same rotation, which is why this opens
 * off a queue row and not off the library.
 */
const SongSettings = ({ artist, keyChange, title, onChangeKey, onClose }: SongSettingsProps) => {
  // Stepping is a request: the prop only moves once the server pushes the queue
  // back. Reading the prop to compute the next step meant every tap that landed
  // inside that round trip was computed from the same stale key and overwrote
  // the last — six fast taps moved the song one semitone. The draft is what the
  // singer is holding; the server's value wins whenever it actually changes.
  const [draft, setDraft] = useState(keyChange)
  const [seen, setSeen] = useState(keyChange)

  // adjusted during render rather than in an effect: an effect would paint the
  // stale key for a frame first, and the compiler's lint rightly rejects it
  if (seen !== keyChange) {
    setSeen(keyChange)
    setDraft(keyChange)
  }

  const set = (next: number) => {
    setDraft(next)
    onChangeKey(next)
  }

  const stepDown = () => set(clampKeyChange(draft - 1))
  const stepUp = () => set(clampKeyChange(draft + 1))
  const reset = () => set(0)

  // hoisted rather than written inline: any ">" inside a JSX attribute — a
  // comparison, or the arrow in an inline handler — reads as the end of the
  // tag to the deck-rules Button check, which then mines this file for a label
  const isAtFloor = draft <= -KEY_CHANGE_MAX
  const isAtCeiling = draft >= KEY_CHANGE_MAX
  const isOriginalKey = draft === 0

  return (
    <Modal
      className={styles.modal}
      onClose={onClose}
      title='Song Settings'
      buttons={<Button variant='primary' onClick={onClose}>Done</Button>}
    >
      <div className={styles.container}>
        <div className={styles.song} translate='no'>
          <div className={styles.title}>{title}</div>
          <div className={styles.artist}>{artist}</div>
        </div>

        {/* a labelled group rather than fieldset/legend: a legend is pulled out
            of its fieldset's flex flow and straddles the well's rounded edge */}
        <div className={styles.section} role='group' aria-labelledby='song-settings-key-label'>
          <div id='song-settings-key-label' className={styles.groupLabel}>Key</div>

          {/* the trim itself: two keys either side of the readout, centred as
              a group rather than stretched, so the value stays the middle of
              the panel however wide the modal gets */}
          <div className={styles.stepper}>
            <Button
              icon='MINUS'
              disabled={isAtFloor}
              aria-label='Lower the key one semitone'
              aria-controls='song-settings-key'
              onClick={stepDown}
            />

            {/* aria-live so a screen reader hears the new key after a step:
                the readout is the only thing that moves, and it isn't focused */}
            <output
              id='song-settings-key'
              className={clsx(styles.readout, !isOriginalKey && styles.readoutShifted)}
              aria-live='polite'
            >
              {formatKeyChange(draft)}
            </output>

            <Button
              icon='PLUS'
              disabled={isAtCeiling}
              aria-label='Raise the key one semitone'
              aria-controls='song-settings-key'
              onClick={stepUp}
            />
          </div>

          <p className={styles.help}>
            {isOriginalKey
              ? 'Plays in the recording’s own key.'
              : `Shifted ${Math.abs(draft)} semitone${Math.abs(draft) === 1 ? '' : 's'} ${draft > 0 ? 'up' : 'down'}. The tempo stays put.`}
          </p>

          <Button variant='default' className={styles.reset} disabled={isOriginalKey} onClick={reset}>
            Reset to original key
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default SongSettings
