import React from 'react'
import { Icon } from '../core/Icon.jsx'
import { VuMeter } from '../core/VuMeter.jsx'
import { UserImage } from '../items/UserImage.jsx'
import { PlayerHeadline } from './PlayerHeadline.jsx'

// Everything the player draws over (or instead of) the video. Six mutually
// exclusive states. Overlays that sit over playing video stay in the top-right and
// are solid panels, keeping the lower two-thirds clear for lyrics.
export function PlayerOverlay ({
  state = 'upNow',
  singer,
  singerImage,
  nextTitle,
  nextArtist,
  secondsLeft,
  comingUpSinger,
  comingUpTitle,
  queueDepth = 0,
  onPlay,
  className,
  style,
}) {
  const cornerPanel = {
    position: 'absolute',
    top: '2vh',
    right: '2vh',
    maxWidth: '46vw',
    padding: '1.4vh 2vh',
    background: 'var(--brush)',
    border: '1px solid var(--hairline)',
    borderRadius: 'var(--radius-panel)',
    boxShadow: 'var(--bevel)',
  }

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: state === 'intermission' ? 'var(--stage-wash)' : undefined,
        ...style,
      }}
    >
      {state === 'empty' && (
        <>
          <div className='silkscreen' style={{ fontSize: '1.6vh' }}>queue empty</div>
          <PlayerHeadline tone='vu' style={{ marginTop: '1.5vh', textAlign: 'center' }}>Add a song</PlayerHeadline>
        </>
      )}

      {state === 'errored' && (
        <>
          <div className='silkscreen' style={{ fontSize: '1.6vh', color: 'var(--alert)' }}>fault</div>
          <PlayerHeadline style={{ marginTop: '1.5vh', textAlign: 'center' }}>Media failed</PlayerHeadline>
          <div className='silkscreen' style={{ marginTop: '1.5vh', fontSize: '1.4vh' }}>see the queue for details</div>
        </>
      )}

      {state === 'idle' && (
        <button
          onClick={onPlay}
          aria-label='Play'
          style={{
            display: 'grid',
            placeItems: 'center',
            width: '26vh',
            height: '26vh',
            borderRadius: 'var(--radius-round)',
            background: 'linear-gradient(145deg, #3a3d42, #1a1c1e)',
            boxShadow: 'var(--bevel)',
            border: 'none',
            color: 'var(--vu)',
            cursor: 'pointer',
          }}
        >
          <Icon icon='PLAY' style={{ width: '11vh', height: '11vh' }} />
        </button>
      )}

      {state === 'intermission' && (
        <>
          {nextTitle && (
            <div translate='no' style={{ textAlign: 'center', maxWidth: '80vw', marginBottom: '2vh' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-semibold)', fontSize: '3.4vh', lineHeight: 1.2, textWrap: 'pretty', color: 'var(--ink)' }}>{nextTitle}</div>
              {nextArtist && <div style={{ fontSize: '2.4vh', color: 'var(--ink-2)' }}>{nextArtist}</div>}
            </div>
          )}
          <UserImage src={singerImage} style={{ height: '22vh', width: '22vh', marginBottom: '2vh' }} />
          <PlayerHeadline tone='vu'>{singer || 'Up next'}</PlayerHeadline>
          {typeof secondsLeft === 'number' && (
            <PlayerHeadline
              key={secondsLeft}
              tone='ink'
              size='var(--display-xl)'
              style={{ marginTop: '1vh', animation: 'tick 200ms var(--ease-key)' }}
            >
              {secondsLeft}
            </PlayerHeadline>
          )}
          {comingUpSinger && (
            <div style={{ marginTop: '2.5vh', textAlign: 'center', maxWidth: '90vw' }}>
              <div className='silkscreen' style={{ fontSize: '1.4vh', marginBottom: '.6vh' }}>coming up</div>
              <div style={{ fontSize: '2.2vh', color: 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {comingUpTitle ? `${comingUpSinger} — ${comingUpTitle}` : comingUpSinger}
              </div>
            </div>
          )}
        </>
      )}

      {(state === 'upNow' || state === 'upNextTease') && singer && (
        <div style={cornerPanel}>
          <div className='silkscreen' style={{ fontSize: '1.1vh', marginBottom: '.5vh' }}>
            {state === 'upNow' ? 'on stage' : 'up next'}
          </div>
          <div
            translate='no'
            style={{
              fontSize: '2vh',
              fontWeight: 'var(--weight-semibold)',
              color: state === 'upNow' ? 'var(--vu)' : 'var(--ink)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {singer}
          </div>
          {nextTitle && (
            <div translate='no' style={{ marginTop: '.6vh', paddingTop: '.6vh', borderTop: 'var(--hair-rule)' }}>
              <div style={{
                fontSize: '1.6vh',
                fontWeight: 'var(--weight-medium)',
                lineHeight: 1.25,
                textWrap: 'pretty',
                color: 'var(--ink)',
              }}
              >
                {nextTitle}
              </div>
              {nextArtist && (
                <div style={{
                  fontSize: '1.4vh',
                  color: 'var(--ink-2)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                >
                  {nextArtist}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {queueDepth > 0 && state !== 'intermission' && (
        <div style={{ position: 'absolute', left: '2vh', right: '2vh', bottom: '2vh', display: 'flex', alignItems: 'center', gap: '1.5vh' }}>
          <span className='silkscreen' style={{ fontSize: '1.1vh', flexShrink: 0 }}>queue {queueDepth}</span>
          <VuMeter value={Math.min(1, queueDepth / 20)} segments={30} peakFrom={2} height={5} />
        </div>
      )}
    </div>
  )
}
