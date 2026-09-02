import React from 'react'
import { ButtonStar } from '../core/ButtonStar.jsx'

// A queueable song, rendered as a key: tapping the row queues it. Queued rows go to
// the standby-teal well and stop responding. Played rows lose their key face.
export function SongItem ({
  title,
  artist,
  tags = [],
  duration,
  isPlayed,
  isUpcoming,
  isStarred,
  numStars = 0,
  onQueue,
  onStar,
  className,
  style,
}) {
  const face = isUpcoming
    ? { background: 'var(--standby-well)', boxShadow: 'none' }
    : isPlayed
      ? { background: 'transparent', boxShadow: 'inset 0 0 0 1px var(--seam)' }
      : { backgroundImage: 'var(--key-face)', boxShadow: 'var(--bevel)' }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--gap-3)',
        minHeight: 'var(--row-song)',
        marginBottom: 'var(--gap-2)',
        padding: 'var(--gap-2) var(--gap-2) var(--gap-2) 0',
        borderRadius: 'var(--radius-key)',
        ...face,
        ...style,
      }}
    >
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        color: 'var(--ink-3)',
        width: 38,
        textAlign: 'right',
        flexShrink: 0,
        alignSelf: 'center',
      }}
      >
        {duration}
      </div>

      <button
        type='button'
        onClick={isUpcoming ? undefined : onQueue}
        disabled={isUpcoming}
        style={{
          flex: 1,
          minWidth: 0,
          alignSelf: 'stretch',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 2,
          padding: 0,
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          cursor: isUpcoming ? 'default' : 'pointer',
        }}
      >
        {/* titles always show in full: they wrap, and the row grows to fit */}
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-m)',
          fontWeight: 'var(--weight-semibold)',
          lineHeight: 1.3,
          textWrap: 'pretty',
          color: isUpcoming ? 'var(--standby)' : isPlayed ? 'var(--ink-4)' : 'var(--ink)',
        }}
        >
          {title}
        </span>
        {(artist || tags.length > 0) && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: isPlayed ? 'var(--ink-5)' : 'var(--ink-3)',
          }}
          >
            {[artist, tags.join(' · ')].filter(Boolean).join(' · ')}
          </span>
        )}
      </button>

      {isUpcoming
        ? (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '.1em',
              color: 'var(--standby)',
              flexShrink: 0,
            }}
            >
              QUEUED
            </span>
          )
        : <ButtonStar isStarred={isStarred} count={numStars} onClick={onStar} style={{ flexShrink: 0, alignSelf: 'center' }} />}
    </div>
  )
}
