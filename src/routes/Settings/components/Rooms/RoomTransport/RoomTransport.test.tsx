// @vitest-environment happy-dom
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import RoomTransport from './RoomTransport'

const dispatch = vi.fn()

vi.mock('store/hooks', () => ({
  useAppDispatch: () => dispatch,
}))

vi.mock('store/modules/rooms', () => ({
  setRoomStatus: vi.fn(arg => ({ type: 'rooms/SET_STATUS', payload: arg })),
}))

const { setRoomStatus } = await import('store/modules/rooms')

const renderTransport = (status: 'play' | 'paused' | 'stopped' = 'play') =>
  render(<RoomTransport roomId={7} name='LOVESHACK' status={status} />)

beforeEach(() => {
  vi.clearAllMocks()
  window.confirm = vi.fn(() => true)
})

afterEach(cleanup)

describe('RoomTransport', () => {
  it('lights the key the room is on, and only that one', () => {
    renderTransport('paused')

    expect(screen.getByLabelText('Pause').getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByLabelText('Play').getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByLabelText('Stop').getAttribute('aria-pressed')).toBe('false')
  })

  it('sends the room to play without asking', () => {
    renderTransport('paused')
    fireEvent.click(screen.getByLabelText('Play'))

    expect(window.confirm).not.toHaveBeenCalled()
    expect(setRoomStatus).toHaveBeenCalledWith({ roomId: 7, status: 'play' })
  })

  // holding the room for an announcement is reversible, so asking would make
  // it feel like a decision
  it('pauses without asking', () => {
    renderTransport('play')
    fireEvent.click(screen.getByLabelText('Pause'))

    expect(window.confirm).not.toHaveBeenCalled()
    expect(setRoomStatus).toHaveBeenCalledWith({ roomId: 7, status: 'paused' })
  })

  it('asks before stopping, since the queue and the scores go', () => {
    renderTransport('play')
    fireEvent.click(screen.getByLabelText('Stop'))

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('LOVESHACK'))
    expect(setRoomStatus).toHaveBeenCalledWith({ roomId: 7, status: 'stopped' })
  })

  it('leaves the room alone when the stop is declined', () => {
    window.confirm = vi.fn(() => false)
    renderTransport('play')
    fireEvent.click(screen.getByLabelText('Stop'))

    expect(setRoomStatus).not.toHaveBeenCalled()
  })

  // pressing the lit key is a no-op, not a re-stop: it would otherwise empty a
  // room that is already stopped, and ask before doing it
  it('ignores a press on the key the room is already on', () => {
    renderTransport('stopped')
    fireEvent.click(screen.getByLabelText('Stop'))

    expect(window.confirm).not.toHaveBeenCalled()
    expect(setRoomStatus).not.toHaveBeenCalled()
  })
})
