import React from 'react'
import { Tabs } from './Tabs.jsx'

// Just the three tabs. The singer's status and pause key live in YourTurn, in the app
// header, so this row carries nothing else.
export function QueueHeader ({
  tab = 'queue',
  onTabChange,
  queueCount = 0,
  myCount = 0,
  historyCount = 0,
  className,
  style,
}) {
  return (
    <div
      className={className}
      style={{ padding: 'var(--gap-3) var(--gap-4)', ...style }}
    >
      <Tabs
        active={tab}
        onChange={onTabChange}
        tabs={[
          { id: 'queue', label: 'Queue', count: queueCount },
          { id: 'me', label: 'Me', count: myCount },
          { id: 'history', label: 'History', count: historyCount },
        ]}
      />
    </div>
  )
}
