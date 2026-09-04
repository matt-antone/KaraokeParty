import React from 'react'
import clsx from 'clsx'
import { useAppDispatch } from 'store/hooks'
import Button from 'components/Button/Button'
import { setRoomStatus } from 'store/modules/rooms'
import { ROOM_STATUSES, type RoomStatus } from 'shared/types'
import styles from './RoomTransport.css'

/**
 * One room's transport, in its row of the rooms list. Same three keys as the
 * player's own strip and in the same order, because they mean the same thing
 * one level up: play runs the room, pause holds it, stop ends the night.
 *
 * The lit key is the room's state rather than a button that does something
 * next — a room is always in one of these, so the strip is the status column
 * as well as the control. That is why there is no separate word beside it.
 */
const LABELS: Record<RoomStatus, { icon: 'PLAY' | 'PAUSE' | 'STOP', label: string }> = {
  play: { icon: 'PLAY', label: 'Play' },
  paused: { icon: 'PAUSE', label: 'Pause' },
  stopped: { icon: 'STOP', label: 'Stop' },
}

interface RoomTransportProps {
  roomId: number
  name: string
  status: RoomStatus
}

const RoomTransport = ({ roomId, name, status }: RoomTransportProps) => {
  const dispatch = useAppDispatch()

  const handleClick = (next: RoomStatus) => {
    if (next === status) return

    // stop is the only key that throws anything away, so it is the only one
    // that asks. Pause is reversible and asking would make holding the room
    // for an announcement feel like a decision
    if (next === 'stopped' && !confirm(`Stop "${name}"?\n\nThe queue is emptied, paused singers are un-paused and every trivia score goes back to zero. Nobody's personal sung history is touched. This cannot be undone.`)) {
      return
    }

    dispatch(setRoomStatus({ roomId, status: next }))
  }

  return (
    <div className={styles.container} role='group' aria-label={`${name} transport`}>
      {ROOM_STATUSES.map((s) => {
        const isActive = s === status

        return (
          <Button
            key={s}
            className={clsx(styles.key, isActive && styles.active)}
            variant={isActive ? 'primary' : 'default'}
            icon={LABELS[s].icon}
            onClick={() => handleClick(s)}
            aria-label={LABELS[s].label}
            aria-pressed={isActive}
          />
        )
      })}
    </div>
  )
}

export default RoomTransport
