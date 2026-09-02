import React from 'react'
import { Icon } from './Icon.jsx'

// A key on a faceplate. Raised face, light from above, 1px of travel on press.
// Tones say what the key does, not how important it looks:
//   panel  — the default graphite key
//   vu     — amber: the primary action, and the transport
//   alert  — red: destructive
//   flush  — no key at all, just a glyph on the panel (row actions, close X)
const TONES = {
  panel: { backgroundImage: 'var(--key-face)', color: 'var(--ink)', boxShadow: 'var(--bevel)' },
  vu: { backgroundImage: 'var(--key-face-vu)', color: 'var(--on-vu)', boxShadow: 'var(--bevel)' },
  alert: { backgroundImage: 'var(--key-face-alert)', color: '#fff', boxShadow: 'var(--bevel)' },
  flush: { background: 'transparent', color: 'var(--ink-2)', boxShadow: 'none' },
}

export function Button ({
  as = 'button',
  tone = 'panel',
  icon,
  iconSize,
  block,
  children,
  className,
  style,
  ...rest
}) {
  const Tag = as
  const t = TONES[tone] || TONES.panel

  return (
    <Tag
      type={as === 'button' ? (rest.type || 'button') : undefined}
      className={className}
      style={{
        display: block ? 'flex' : 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: children && icon ? 'var(--gap-2)' : 0,
        width: block ? '100%' : undefined,
        minWidth: children ? undefined : 'var(--target)',
        minHeight: 'var(--target)',
        padding: children ? '0 var(--gap-5)' : 0,
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-m)',
        fontWeight: 'var(--weight-bold)',
        border: 'none',
        borderRadius: 'var(--radius-key)',
        cursor: 'pointer',
        transition: 'transform var(--dur-key) var(--ease-key)',
        ...t,
        ...style,
      }}
      onPointerDown={(e) => {
        if (tone !== 'flush') e.currentTarget.style.transform = 'translateY(1px)'
        if (rest.onPointerDown) rest.onPointerDown(e)
      }}
      onPointerUp={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        if (rest.onPointerUp) rest.onPointerUp(e)
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        if (rest.onPointerLeave) rest.onPointerLeave(e)
      }}
      {...rest}
    >
      {icon && <Icon icon={icon} size={iconSize} />}
      {children}
    </Tag>
  )
}
