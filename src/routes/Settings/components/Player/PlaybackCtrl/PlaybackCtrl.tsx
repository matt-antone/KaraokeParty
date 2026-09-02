import React, { useState } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import clsx from 'clsx'
import { requestOptions, requestPause, requestPlay, requestPlayNext, requestVolume } from 'store/modules/status'
import Button from 'components/Button/Button'
import Knob from 'components/Knob/Knob'
import VuMeter from 'components/VuMeter/VuMeter'
import DisplayCtrl from '../DisplayCtrl/DisplayCtrl'
import styles from './PlaybackCtrl.css'
import { PlaybackOptions } from 'shared/types'

/**
 * The room transport. Its only home is the Player panel on the Settings screen:
 * player controls are admin-only and a singer does not pause the room, not even
 * during their own song. Order never changes — play/pause, skip, volume,
 * display, fullscreen. Play/pause is the single amber key; skip is graphite
 * with an amber glyph, because skipping someone's song deserves one more
 * moment of thought than pausing. The knob is the input and the meter beside
 * it is the readout; there is no volume number.
 */
const PlaybackCtrl = () => {
  const [isDisplayCtrlVisible, setDisplayCtrlVisible] = useState(false)
  const status = useAppSelector(state => state.status)

  const dispatch = useAppDispatch()
  const handleOptions = (opts: PlaybackOptions) => dispatch(requestOptions(opts))
  const handlePause = () => dispatch(requestPause())
  const handlePlay = () => dispatch(requestPlay())
  const handlePlayNext = () => dispatch(requestPlayNext())
  const handleVolume = (val: number) => dispatch(requestVolume(val))

  const toggleDisplayCtrl = () => setDisplayCtrlVisible(!isDisplayCtrlVisible)

  return (
    <div className={styles.container}>
      <Button
        className={clsx(styles.key, styles.transport)}
        variant='primary'
        icon={status.isPlaying ? 'PAUSE' : 'PLAY'}
        onClick={status.isPlaying ? handlePause : handlePlay}
        aria-label={status.isPlaying ? 'Pause' : 'Play'}
      />

      <Button
        className={clsx(styles.key, styles.transport, styles.next)}
        variant='default'
        icon='PLAY_NEXT'
        onClick={handlePlayNext}
        aria-label='Play Next'
      />

      <div className={styles.volume}>
        <Knob value={status.volume} onChange={handleVolume} label='vol' />
        <VuMeter
          value={status.isPlaying ? status.volume * 0.85 : 0}
          segments={14}
          label='Room level'
        />
      </div>

      <Button
        className={styles.key}
        variant='default'
        icon='TUNE'
        onClick={toggleDisplayCtrl}
        aria-label='Display Options'
      />

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
    </div>
  )
}

export default PlaybackCtrl
