import React from 'react'
import { Button } from '../core/Button.jsx'
import { Knob } from '../core/Knob.jsx'
import { VuMeter } from '../core/VuMeter.jsx'

// The transport strip. Fixed order: play/pause, skip, volume knob + level meter,
// display, fullscreen. Play/pause is the amber key; everything else is graphite.
export function PlaybackCtrl ({
  isPlaying,
  volume = 0.8,
  level,
  showFullscreen,
  onPlay,
  onPause,
  onPlayNext,
  onVolumeChange,
  onDisplayCtrl,
  onFullscreen,
  className,
  style,
}) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--gap-3)',
        padding: 'var(--gap-3) var(--gap-4)',
        ...style,
      }}
    >
      <Button
        tone='vu'
        icon={isPlaying ? 'PAUSE' : 'PLAY'}
        iconSize={30}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        onClick={isPlaying ? onPause : onPlay}
        style={{ minWidth: 'var(--target-l)', minHeight: 'var(--target-l)' }}
      />
      <Button
        tone='panel'
        icon='PLAY_NEXT'
        iconSize={26}
        aria-label='Play next'
        onClick={onPlayNext}
        style={{ minWidth: 'var(--target-l)', minHeight: 'var(--target-l)', color: 'var(--vu)' }}
      />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 'var(--gap-3)' }}>
        <Knob value={volume} onChange={onVolumeChange} label='vol' />
        <VuMeter value={level != null ? level : (isPlaying ? volume * 0.85 : 0)} segments={14} height={12} />
      </div>

      <Button
        tone='panel'
        icon='TUNE'
        iconSize={24}
        aria-label='Display options'
        onClick={onDisplayCtrl}
        style={{ minWidth: 'var(--target-l)', minHeight: 'var(--target-l)' }}
      />
      {showFullscreen && (
        <Button
          tone='panel'
          icon='FULLSCREEN'
          iconSize={24}
          aria-label='Enter fullscreen'
          onClick={onFullscreen}
          style={{ minWidth: 'var(--target-l)', minHeight: 'var(--target-l)' }}
        />
      )}
    </div>
  )
}
