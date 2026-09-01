import React from 'react'
import { VuMeter } from './VuMeter.jsx'

// Loading is a meter with no signal: segments lit low and drifting. Deliberately
// close to the VU meter, because on this panel "working" and "level" look alike.
export function Spinner ({ className, style }) {
  const [v, setV] = React.useState(0.2)

  React.useEffect(() => {
    let dir = 1
    const id = setInterval(() => {
      setV((prev) => {
        const next = prev + dir * 0.08
        if (next > 0.62 || next < 0.12) dir *= -1
        return Math.max(0.12, Math.min(0.62, next))
      })
    }, 110)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className={className}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 'var(--gap-5)', ...style }}
    >
      <VuMeter value={v} segments={16} peakFrom={2} height={14} style={{ maxWidth: 180 }} />
    </div>
  )
}
