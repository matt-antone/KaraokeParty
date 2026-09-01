import React from 'react'
import clsx from 'clsx'
import { Link } from 'react-router'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { setPref } from 'store/modules/prefs'
import Panel from 'components/Panel/Panel'
import Icon from 'components/Icon/Icon'
import InputCheckbox from 'components/InputCheckbox/InputCheckbox'
import PlaybackCtrl from './PlaybackCtrl/PlaybackCtrl'
import styles from './Player.css'

/**
 * Everything about the player lives here and nowhere else: its status, the key
 * that opens it, its display options and the room transport. It is a room
 * fixture the host sets up once on the machine driving the audio, not a place
 * anyone navigates to — so there is no Player tab, no player entry in the
 * bottom nav, and no transport in the app header.
 */
const Player = () => {
  const isPlayerPresent = useAppSelector(state => state.status.isPlayerPresent)
  const isReplayGainEnabled = useAppSelector(state => state.prefs.isReplayGainEnabled)
  const roomName = useAppSelector(state => (
    state.user.roomId === null ? undefined : state.rooms.entities[state.user.roomId]?.name
  ))

  const dispatch = useAppDispatch()
  const handleReplayGain = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setPref({ key: e.currentTarget.name, data: e.currentTarget.checked }))
  }

  return (
    <Panel title='Player' contentClassName={styles.content}>
      <>
        <div className={styles.status}>
          <span className={clsx(styles.lamp, isPlayerPresent && styles.lit)} />
          <span className='silkscreen' translate='no'>
            {isPlayerPresent ? 'connected' : 'no player in room'}
            {roomName && ` · ${roomName}`}
          </span>
        </div>

        <p className={styles.blurb}>
          Runs fullscreen on whatever machine drives the room&rsquo;s audio. Open it there, or
          scan the join code it shows.
        </p>

        {/* the room transport: admin-only, and this is its only home. With no
            player connected there is nothing to drive, so the prompt to open
            one stands in its place rather than a disabled transport. */}
        {isPlayerPresent && <PlaybackCtrl />}

        <Link to='/player' target='_blank' className={styles.openKey}>
          <Icon icon='TELEVISION_PLAY' />
          Open Player Here
        </Link>

        <InputCheckbox
          label='ReplayGain (clip-safe)'
          name='isReplayGainEnabled'
          checked={isReplayGainEnabled}
          onChange={handleReplayGain}
        />
      </>
    </Panel>
  )
}

export default Player
