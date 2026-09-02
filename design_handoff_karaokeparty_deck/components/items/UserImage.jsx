import React, { useState } from 'react'
import { Icon } from '../core/Icon.jsx'

// Square singer photo. Falls back to a dim glyph in a recessed well while loading
// and permanently if the image is missing — plenty of guests never add one.
export function UserImage ({ src, className, style }) {
  const [failed, setFailed] = useState(false)

  return (
    <div
      className={className}
      style={{
        aspectRatio: 1,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        borderRadius: 'var(--radius-key)',
        background: 'var(--key-well)',
        boxShadow: 'var(--well-deep)',
        ...style,
      }}
    >
      {(!src || failed)
        ? <Icon icon='PERSON' style={{ width: '60%', height: '60%', color: 'var(--ink-5)' }} />
        : (
            <img
              src={src}
              alt=''
              onError={() => setFailed(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
    </div>
  )
}
