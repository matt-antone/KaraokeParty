import React from 'react'

// The only round thing besides a knob. 22px, hairline ring, amber core when selected.
export function InputRadio ({ name, value, label, checked, onChange, className, style }) {
  return (
    <label
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--gap-3)',
        minHeight: 'var(--target)',
        cursor: 'pointer',
        fontSize: 'var(--text-l)',
        ...style,
      }}
    >
      <input
        type='radio'
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange && onChange(value)}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          width: 22,
          height: 22,
          flexShrink: 0,
          margin: 0,
          borderRadius: 'var(--radius-round)',
          border: `2px solid ${checked ? 'var(--vu)' : 'var(--hairline)'}`,
          background: checked
            ? 'radial-gradient(circle, var(--vu) 0%, var(--vu) 58%, transparent 58%)'
            : 'var(--key-well)',
          boxShadow: checked ? 'none' : 'var(--well)',
          outline: 'none',
          cursor: 'pointer',
        }}
      />
      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </label>
  )
}
