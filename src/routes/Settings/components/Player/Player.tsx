import React, { useState } from 'react'
import clsx from 'clsx'
import { Link } from 'react-router'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { setPref } from 'store/modules/prefs'
import { requestOptions } from 'store/modules/status'
import Panel from 'components/Panel/Panel'
import Icon from 'components/Icon/Icon'
import Button from 'components/Button/Button'
import InputCheckbox from 'components/InputCheckbox/InputCheckbox'
import PlaybackCtrl from './PlaybackCtrl/PlaybackCtrl'
import DisplayCtrl from './DisplayCtrl/DisplayCtrl'
import JoinCode from './JoinCode/JoinCode'
import styles from './Player.css'
import { PlaybackOptions } from 'shared/types'

/**
 * Everything about the player lives here and nowhere else: its status, the key
 * that opens it, its display options and the room transport. It is a room
 * fixture the host sets up once on the machine driving the audio, not a place
 * anyone navigates to — so there is no Player tab, no player entry in the
 * bottom nav, and no transport in the app header.
 */
const Player = () => {
  const [isDisplayCtrlVisible, setDisplayCtrlVisible] = useState(false)
  const [isJoinCodeVisible, setJoinCodeVisible] = useState(false)

  const status = useAppSelector(state => state.status)
  const isPlayerPresent = status.isPlayerPresent
  const isReplayGainEnabled = useAppSelector(state => state.prefs.isReplayGainEnabled)
  const serverUrl = useAppSelector(state => state.prefs.serverUrl)
  const roomId = useAppSelector(state => state.user.roomId)
  const room = useAppSelector(state => (roomId === null ? undefined : state.rooms.entities[roomId]))
  const roomName = room?.name

  const dispatch = useAppDispatch()
  const handleReplayGain = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setPref({ key: e.currentTarget.name, data: e.currentTarget.checked }))
  }
  const handleOptions = (opts: PlaybackOptions) => dispatch(requestOptions(opts))
  const toggleDisplayCtrl = () => setDisplayCtrlVisible(!isDisplayCtrlVisible)
  const toggleJoinCode = () => setJoinCodeVisible(!isJoinCodeVisible)

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

        <Button variant='default' icon='QR_CODE' onClick={toggleJoinCode}>
          Show Join Code
        </Button>

        {isJoinCodeVisible && roomId !== null && (
          <JoinCode
            roomId={roomId}
            serverUrl={serverUrl}
            qrPassword={room?.prefs?.qr?.password}
            onClose={toggleJoinCode}
          />
        )}

        <InputCheckbox
          label='ReplayGain (clip-safe)'
          name='isReplayGainEnabled'
          checked={isReplayGainEnabled}
          onChange={handleReplayGain}
        />

        {/* Display options live here, independent of the transport, so they stay
            reachable with no player connected. */}
        <Button variant='default' icon='TUNE' onClick={toggleDisplayCtrl}>
          Display
        </Button>

        {isDisplayCtrlVisible && (
          <DisplayCtrl
            cdgAlpha={status.cdgAlpha}
            cdgSize={status.cdgSize}
            isVideoKeyingEnabled={status.isVideoKeyingEnabled}
            isVisualizerEnabled={status.visualizer.isEnabled}
            isWebGLSupported={status.isWebGLSupported}
            mediaType={status.mediaType}
            mp4Alpha={status.mp4Alpha}
            onClose={toggleDisplayCtrl}
            onRequestOptions={handleOptions}
            sensitivity={status.visualizer.sensitivity}
            visualizerPresetName={status.visualizer.presetName}
          />
        )}
      </>
    </Panel>
  )
}

export default Player
