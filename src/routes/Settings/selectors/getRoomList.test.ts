import { describe, expect, it } from 'vitest'
import getRoomList from './getRoomList'
import roomsReducer from 'store/modules/rooms'
import type { RootState } from 'store/store'

const rooms = {
  1: { roomId: 1, name: 'Playing', status: 'play' },
  2: { roomId: 2, name: 'Paused', status: 'paused' },
  3: { roomId: 3, name: 'Stopped', status: 'stopped' },
}

// the reducer's own initial state, so the default this asserts is the real one
const initialRooms = roomsReducer(undefined, { type: '@@INIT' })

const stateWith = (filterStatus: boolean | string) => ({
  rooms: { ...initialRooms, result: [1, 2, 3], entities: rooms, filterStatus },
}) as unknown as RootState

describe('getRoomList', () => {
  // pressing stop moves a room out of 'play'. If the default filter hid it, the
  // room would disappear from the list the moment it was stopped, which reads
  // as having deleted it.
  it('shows every room by default, whatever its transport', () => {
    const state = { rooms: { ...initialRooms, result: [1, 2, 3], entities: rooms } } as unknown as RootState

    expect(getRoomList(state).result).toEqual([1, 2, 3])
  })

  it('narrows to one transport when asked', () => {
    expect(getRoomList(stateWith('paused')).result).toEqual([2])
    expect(getRoomList(stateWith('stopped')).result).toEqual([3])
  })

  it('shows everything again when the filter is cleared', () => {
    expect(getRoomList(stateWith(false)).result).toEqual([1, 2, 3])
  })
})
