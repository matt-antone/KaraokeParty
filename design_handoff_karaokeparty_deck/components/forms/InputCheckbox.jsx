import React from 'react'

// A latching key: recessed well when off, amber and flush when on, with a
// clip-path tick in the panel's dark ink.
export function InputCheckbox ({ label, checked, disabled, onChange, className, style }) {
  return (
    <label
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--gap-3)',
        minHeight: 'var(--target)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        fontSize: 'var(--text-l)',
        ...style,
      }}
    >
      <input
        type='checkbox'
        checked={checked}
        disabled={disabled}
        onChange={e => onChange && onChange(e.target.checked)}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, margin: 0 }}
      />
      <span
        aria-hidden
        style={{
          width: 22,
          height: 22,
          flexShrink: 0,
          borderRadius: 2,
          display: 'grid',
          placeContent: 'center',
          background: checked ? 'var(--vu)' : 'var(--key-well)',
          boxShadow: checked ? 'var(--bevel)' : 'var(--well)',
        }}
      >
        <span style={{
          width: 12,
          height: 12,
          background: 'var(--on-vu)',
          clipPath: 'polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%)',
          transform: checked ? 'scale(1)' : 'scale(0)',
          transition: 'transform var(--dur-key) var(--ease-key)',
        }}
        />
      </span>
      {label}
    </label>
  )
}
