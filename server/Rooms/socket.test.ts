import { describe, expect, it, vi } from 'vitest'
import ACTION_HANDLERS from './socket.js'
import Queue from '../Queue/Queue.js'
import {
  ROOM_RESET_REQUEST,
  PLAYER_CMD_HISTORY_RESET,
  QUEUE_PUSH,
  _ERROR,
} from '../../shared/actionTypes.js'

vi.mock('../Queue/Queue.js', () => ({
  default: {
    clear: vi.fn(),
    get: vi.fn(() => ({ result: [], entities: {}, pausedUserIds: [] })),
  },
}))

const makeSock = (isAdmin: boolean) => {
  const emit = vi.fn()
  return {
    emit,
    sock: {
      user: { isAdmin },
      server: { to: vi.fn(() => ({ emit })) },
    },
  }
}

describe('ROOM_RESET_REQUEST', () => {
  const handler = ACTION_HANDLERS[ROOM_RESET_REQUEST]

  it('empties the named room and tells it, not the sender\'s room', () => {
    const { emit, sock } = makeSock(true)
    handler(sock, { payload: { roomId: 7 } }, vi.fn())

    expect(Queue.clear).toHaveBeenCalledWith(7)
    expect(sock.server.to).toHaveBeenCalledWith(expect.stringContaining('7'))
    expect(emit.mock.calls.map(([, action]) => action.type))
      .toEqual([QUEUE_PUSH, PLAYER_CMD_HISTORY_RESET])
  })

  it('refuses non-admins without touching the queue', () => {
    vi.mocked(Queue.clear).mockClear()
    const { emit, sock } = makeSock(false)
    const acknowledge = vi.fn()
    handler(sock, { payload: { roomId: 7 } }, acknowledge)

    expect(Queue.clear).not.toHaveBeenCalled()
    expect(emit).not.toHaveBeenCalled()
    expect(acknowledge).toHaveBeenCalledWith(expect.objectContaining({
      type: ROOM_RESET_REQUEST + _ERROR,
    }))
  })
})
