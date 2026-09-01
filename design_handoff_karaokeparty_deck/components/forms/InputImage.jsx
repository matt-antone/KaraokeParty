import React from 'react'
import { Icon } from '../core/Icon.jsx'
import { Button } from '../core/Button.jsx'

// Avatar picker. Empty is a recessed well with a dim add-photo glyph; filled shows
// the square crop with an alert-toned clear key in the corner.
export function InputImage ({ src, size = 96, onChange, onClear, className, style }) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        borderRadius: 'var(--radius-key)',
        background: 'var(--key-well)',
        boxShadow: 'var(--well)',
        cursor: 'pointer',
        ...style,
      }}
    >
      {src
        ? <img src={src} alt='' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <Icon icon='PHOTO_ADD' size={38} style={{ color: 'var(--ink-5)' }} />}

      <input
        type='file'
        accept='image/*'
        aria-label='Choose a photo'
        onChange={e => onChange && onChange(e.target.files && e.target.files[0])}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'inherit',
        }}
      />

      {src && (
        <Button
          tone='flush'
          icon='CLEAR'
          iconSize={24}
          onClick={onClear}
          aria-label='Remove photo'
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, minWidth: 'var(--target)', minHeight: 'var(--target)', color: 'var(--alert)' }}
        />
      )}
    </div>
  )
}
