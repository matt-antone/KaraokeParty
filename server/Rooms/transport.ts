import Rooms from './Rooms.js'
import Queue from '../Queue/Queue.js'
import Trivia from '../Trivia/Trivia.js'
import {
  PLAYER_CMD_HISTORY_RESET,
  PLAYER_CMD_PAUSE,
  QUEUE_PUSH,
} from '../../shared/actionTypes.js'

/**
 * Move a room's transport and do what the new state means.
 *
 * Recording the status is the small half: Rooms.validate reads it and that is
 * what shuts the door on new singers and new queue entries. The rest is what
 * has to happen to a room that is already running.
 *
 * Separate from the route so the transitions can be exercised without a Koa
 * context; the route is the caller that has the socket server.
 */
export default function setRoomTransport (io, roomId: number, status: string): void {
  Rooms.setStatus(roomId, status)

  // Both non-playing states take the room off the stage. Whatever was up would
  // otherwise keep playing to a room that has just been closed out from under
  // it — the singer has stopped, and the screen should agree.
  if (status !== 'play') {
    io.to(Rooms.prefix(roomId)).emit('action', { type: PLAYER_CMD_PAUSE })
  }

  if (status !== 'stopped') return

  // The night is over: the queue goes, every sitting-out pause with it, and the
  // scoreboard starts empty for whoever is here next. Pause deliberately does
  // none of this — the whole difference between the two states is what stop
  // throws away.
  Queue.clear(roomId)
  Trivia.resetScores(roomId)

  // a round still in flight is asking a question on a queue row that no longer
  // exists, and would re-queue its successor into the room just emptied.
  // Stopping it also drops its timers.
  Trivia.stopRoom(roomId)

  io.to(Rooms.prefix(roomId)).emit('action', {
    type: QUEUE_PUSH,
    payload: Queue.get(roomId),
  })

  // the played list lives in the running player, not the database, so it takes
  // a command. With no player connected this is a no-op.
  io.to(Rooms.prefix(roomId)).emit('action', { type: PLAYER_CMD_HISTORY_RESET })
}
