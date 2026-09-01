import React from 'react'
import { ButtonStar } from '../core/ButtonStar.jsx'
import { Icon } from '../core/Icon.jsx'
import { SwipeRow } from '../core/SwipeRow.jsx'
import { UserImage } from './UserImage.jsx'

// A channel in the rotation. The playing row is its own progress readout: an amber
// wash grows to pctPlayed behind the content, with a slow sweep while audio runs.
export function QueueItem ({
  title,
  artist,
  userDisplayName,
  userImage,
  wait,
  isCurrent,
  isPlaying,
  isPlayed,
  isPaused,
  isOwner,
  isStarred,
  isOpen,
  onOpenChange,
  isUpcoming,
  starCount = 0,
  pctPlayed = 0,
  showStar = true,
  showDragHandle,
  actions = [],
  onStar,
  className,
  style,
}) {
  const progress = isCurrent ? Math.max(2, pctPlayed) : 0
  const dim = isPlayed || isPaused

  return (
    <SwipeRow
      actions={actions}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className={className}
      style={{
        marginBottom: 'var(--gap-2)',
        boxShadow: 'var(--bevel)',
        // the owner rule lives on the shell, so it stays visible while the row is
        // swiped aside — that is exactly when you need to know it is yours
        borderLeft: isOwner ? '2px solid var(--vu)' : '2px solid transparent',
        ...style,
      }}
    >
      {/* NOTE: never put opacity on this element. It is the row's only opaque layer;
          anything below 1 lets the action keys behind it ghost through. "Spent" is
          expressed in colour, via the ink ramp. */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--gap-3)',
        minHeight: 'var(--row-queue)',
        padding: 'var(--gap-2) var(--gap-2) var(--gap-2) var(--gap-3)',
        overflow: 'hidden',
        background: 'var(--brush)',
      }}
      >
      {isCurrent && (
        <>
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: `${progress}%`,
              background: 'linear-gradient(180deg, rgba(255,138,30,.26), rgba(255,138,30,.08))',
              borderRight: '2px solid var(--vu)',
              pointerEvents: 'none',
            }}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: `${progress}%`,
              background: 'linear-gradient(90deg, transparent 35%, rgba(255,196,120,.16) 50%, transparent 65%)',
              backgroundSize: '55% 100%',
              backgroundRepeat: 'no-repeat',
              animation: 'vu-sweep 4s linear infinite',
              animationPlayState: isPlaying ? 'running' : 'paused',
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      {showDragHandle && (
        <div style={{ position: 'relative', display: 'grid', placeItems: 'center', color: 'var(--ink-5)', cursor: 'grab', touchAction: 'none', flexShrink: 0 }}>
          <Icon icon='DRAG_INDICATOR' size={22} />
        </div>
      )}

      <div style={{ position: 'relative', width: 'var(--avatar-queue)', flexShrink: 0, filter: dim ? 'grayscale(1) brightness(.7)' : 'none' }}>
        <UserImage src={userImage} style={{ width: '100%' }} />
        {(isUpcoming || isCurrent) && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: 8.5,
            letterSpacing: '.06em',
            padding: '2px 4px',
            borderRadius: '2px 0 3px 0',
            background: isCurrent ? 'var(--vu)' : 'var(--chassis-deep)',
            color: isCurrent ? 'var(--on-vu)' : 'var(--ink-2)',
          }}
          >
            {isPaused ? <Icon icon='PAUSE' size={12} /> : isCurrent ? 'NOW' : wait}
          </div>
        )}
      </div>

      <div translate='no' style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        {/* titles always show in full: they wrap, and the row grows to fit */}
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--weight-semibold)',
          lineHeight: 1.2,
          textWrap: 'pretty',
          color: dim ? 'var(--ink-4)' : 'var(--ink)',
        }}
        >
          {title}
        </div>
        <div style={{
          fontSize: 'var(--text-m)',
          color: dim ? 'var(--ink-5)' : 'var(--ink-2)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        >
          {artist}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9.5,
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          marginTop: 3,
          color: dim ? 'var(--ink-5)' : isOwner ? 'var(--vu)' : 'var(--ink-3)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        >
          {userDisplayName}
        </div>
      </div>

      {showStar && (
        <ButtonStar
          isStarred={isStarred}
          count={starCount}
          onClick={onStar}
          style={{ position: 'relative', flexShrink: 0, alignSelf: 'center' }}
        />
      )}
      </div>
    </SwipeRow>
  )
}
