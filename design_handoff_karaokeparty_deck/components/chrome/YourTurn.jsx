import React from 'react'
import { Button } from '../core/Button.jsx'
import { VuMeter } from '../core/VuMeter.jsx'

// "Your Turn" — the singer's own channel strip, and the app's header. It answers the
// only two questions a singer actually has, on every screen: when am I on, and can I
// step out. The wait is set in Michroma because it is the one number on the phone
// worth reading at arm's length in a dark room.
export function YourTurn ({
  isUpNow,
  wait,
  position,
  rotationSize,
  songCount = 0,
  isPaused,
  onTogglePaused,
  className,
  style,
}) {
  const lit = isPaused
    ? 0
    : isUpNow
      ? 1
      : (position && rotationSize ? Math.max(0.06, 1 - (position - 1) / rotationSize) : 0.5)

  const headline = isPaused ? 'Paused' : isUpNow ? 'Now' : wait || '--'

  const label = isPaused
    ? 'you are out of the rotation'
    : isUpNow
      ? 'you are on stage'
      : position
        ? `${position} of ${rotationSize} in the rotation`
        : 'nothing queued'

  return (
    <div
      className={className}
      style={{
        background: 'var(--brush)',
        borderRadius: 'var(--radius-panel)',
        boxShadow: 'var(--bevel)',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 'var(--gap-3)',
        padding: 'var(--gap-3) var(--gap-4) var(--gap-2)',
      }}
      >
        <div style={{ minWidth: 0 }}>
          <div className='silkscreen' style={{ marginBottom: 3 }}>your turn</div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.15rem',
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            lineHeight: 1,
            color: isPaused ? 'var(--ink-3)' : 'var(--vu)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          >
            {headline}
          </div>
        </div>
        <div className='silkscreen' style={{ textAlign: 'right', flexShrink: 0 }}>
          {songCount} {songCount === 1 ? 'song' : 'songs'}
        </div>
      </div>

      <div style={{ padding: '0 var(--gap-4)' }}>
        {/* always 24 segments: the meter reads as a level filling toward your turn,
            which a 4-block meter cannot do. Position lives in the value. */}
        <VuMeter value={lit} segments={24} peakFrom={2} height={6} />
        <div className='silkscreen' style={{ marginTop: 5 }}>{label}</div>
      </div>

      <div style={{ padding: 'var(--gap-2) var(--gap-4) var(--gap-3)' }}>
        <Button
          tone={isPaused ? 'vu' : 'panel'}
          icon={isPaused ? 'PLAY' : 'PAUSE'}
          iconSize={20}
          block
          onClick={onTogglePaused}
        >
          {isPaused ? 'Resume my songs' : 'Pause my songs'}
        </Button>
      </div>
    </div>
  )
}
