import React from 'react'
import { Button } from '../core/Button.jsx'
import { VuMeter } from '../core/VuMeter.jsx'

// Media-scanner status, admin only. The progress readout is a VU meter, so the
// panel has one visual language for "how far along".
export function ProgressBar ({ pct = 0, text, isActive, onCancel, onClose, className, style }) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--gap-3)',
        minHeight: 'var(--header-bar)',
        padding: '0 var(--gap-2) 0 var(--gap-4)',
        borderTop: 'var(--seam-rule)',
        ...style,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className='silkscreen'
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}
        >
          {text}
        </div>
        <VuMeter value={pct / 100} segments={20} peakFrom={2} height={6} />
      </div>
      <Button
        tone='flush'
        icon='CLEAR'
        iconSize={22}
        onClick={isActive ? onCancel : onClose}
        aria-label={isActive ? 'Stop scan' : 'Dismiss'}
        style={{ color: isActive ? 'var(--alert)' : 'var(--ink-3)' }}
      />
    </div>
  )
}
