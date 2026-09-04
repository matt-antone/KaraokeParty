import { beforeEach, describe, expect, it, vi } from 'vitest'
import setRoomTransport from './transport.js'
import Rooms from './Rooms.js'
import Queue from '../Queue/Queue.js'
import Trivia from '../Trivia/Trivia.js'
import {
  PLAYER_CMD_HISTORY_RESET,
  PLAYER_CMD_PAUSE,
  QUEUE_PUSH,
} from '../../shared/actionTypes.js'

vi.mock('./Rooms.js', () => ({
  default: {
    setStatus: vi.fn(),
    prefix: (roomId: number) => `ROOM_ID_${roomId}`,
  },
}))

vi.mock('../Queue/Queue.js', () => ({
  default: {
    clear: vi.fn(),
    get: vi.fn(() => ({ result: [], entities: {}, pausedUserIds: [] })),
  },
}))

vi.mock('../Trivia/Trivia.js', () => ({
  default: {
    resetScores: vi.fn(),
    stopRoom: vi.fn(),
  },
}))

const ROOM_ID = 7

const fakeIo = () => {
  const emit = vi.fn()
  return { emit, io: { to: vi.fn(() => ({ emit })) } }
}

const typesEmitted = (emit: ReturnType<typeof vi.fn>) =>
  emit.mock.calls.map(([, action]) => action.type)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('setRoomTransport', () => {
  it('records the status and leaves a playing room alone', () => {
    const { emit, io } = fakeIo()
    setRoomTransport(io, ROOM_ID, 'play')

    expect(Rooms.setStatus).toHaveBeenCalledWith(ROOM_ID, 'play')
    expect(emit).not.toHaveBeenCalled()
    expect(Queue.clear).not.toHaveBeenCalled()
  })

  // an intermission, not the end of the night: the room is off the stage but
  // the queue and the scoreboard are exactly where it left them
  it('stops the player on pause without emptying anything', () => {
    const { emit, io } = fakeIo()
    setRoomTransport(io, ROOM_ID, 'paused')

    expect(Rooms.setStatus).toHaveBeenCalledWith(ROOM_ID, 'paused')
    expect(typesEmitted(emit)).toEqual([PLAYER_CMD_PAUSE])
    expect(Queue.clear).not.toHaveBeenCalled()
    expect(Trivia.resetScores).not.toHaveBeenCalled()
  })

  it('empties the queue and the scoreboard on stop', () => {
    const { emit, io } = fakeIo()
    setRoomTransport(io, ROOM_ID, 'stopped')

    expect(Queue.clear).toHaveBeenCalledWith(ROOM_ID)
    expect(Trivia.resetScores).toHaveBeenCalledWith(ROOM_ID)
    // a round mid-flight would otherwise re-queue into the room just emptied
    expect(Trivia.stopRoom).toHaveBeenCalledWith(ROOM_ID)
    expect(typesEmitted(emit)).toEqual([PLAYER_CMD_PAUSE, QUEUE_PUSH, PLAYER_CMD_HISTORY_RESET])
  })

  it('talks to the named room, not whichever one the admin is signed into', () => {
    const { io } = fakeIo()
    setRoomTransport(io, ROOM_ID, 'stopped')

    for (const [target] of io.to.mock.calls) {
      expect(target).toBe(`ROOM_ID_${ROOM_ID}`)
    }
  })

  it('does not touch the room when the status is rejected', () => {
    vi.mocked(Rooms.setStatus).mockImplementationOnce(() => {
      throw new Error('Invalid room status')
    })
    const { emit, io } = fakeIo()

    expect(() => setRoomTransport(io, ROOM_ID, 'nonsense')).toThrow()
    expect(emit).not.toHaveBeenCalled()
    expect(Queue.clear).not.toHaveBeenCalled()
  })
})
