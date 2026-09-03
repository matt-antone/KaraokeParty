import Rooms from './Rooms.js'
import Queue from '../Queue/Queue.js'
import {
  ROOM_PREFS_PUSH_REQUEST,
  ROOM_PREFS_PUSH,
  ROOM_RESET_REQUEST,
  PLAYER_CMD_HISTORY_RESET,
  QUEUE_PUSH,
  _ERROR,
} from '../../shared/actionTypes.js'

const ACTION_HANDLERS = {
  [ROOM_PREFS_PUSH_REQUEST]: async (sock, { payload }, acknowledge) => {
    const { roomId } = payload

    if (!sock.user.isAdmin || !roomId) {
      acknowledge({
        type: ROOM_PREFS_PUSH_REQUEST + _ERROR,
        error: 'Unauthorized',
      })
    }

    const sockets = await sock.server.in(Rooms.prefix(roomId)).fetchSockets()

    for (const s of sockets) {
      if (s?.user.isAdmin) {
        sock.server.to(s.id).emit('action', {
          type: ROOM_PREFS_PUSH,
          payload,
        })
      }
    }
  },
  // hand a used room back in the state a brand new one would be in: queue
  // emptied, pauses lifted, and the player's played list cleared. Targets a
  // roomId rather than the sender's own room, because between nights the admin
  // is not necessarily signed in to the room being reset
  [ROOM_RESET_REQUEST]: (sock, { payload }, acknowledge) => {
    const { roomId } = payload

    if (!sock.user.isAdmin || !roomId) {
      return acknowledge({
        type: ROOM_RESET_REQUEST + _ERROR,
        error: 'Unauthorized',
      })
    }

    Queue.clear(roomId)

    acknowledge({ type: ROOM_RESET_REQUEST + '_SUCCESS' })

    sock.server.to(Rooms.prefix(roomId)).emit('action', {
      type: QUEUE_PUSH,
      payload: Queue.get(roomId),
    })

    // the played list lives in the running player, not the database, so it
    // takes a command. Between nights the player is closed and this is a no-op
    // @todo: emit to players only
    sock.server.to(Rooms.prefix(roomId)).emit('action', {
      type: PLAYER_CMD_HISTORY_RESET,
    })
  },
}

export default ACTION_HANDLERS
