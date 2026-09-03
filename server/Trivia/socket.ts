import Trivia from './Trivia.js'
import {
  TRIVIA_ANSWER,
  TRIVIA_REQ_ROUND,
  TRIVIA_SCORES_RESET,
  _ERROR,
} from '../../shared/actionTypes.js'

const ACTION_HANDLERS = {
  // The player reached a trivia row in the queue. It asks rather than starts:
  // the question, the shuffle and the countdown all have to be the room's, not
  // one client's, or two players in a room would disagree about the answer.
  [TRIVIA_REQ_ROUND]: (sock, { payload }, acknowledge) => {
    const { roomId } = sock.user
    const { queueId } = payload

    // "A round is already running on this row" and "there is nothing to play
    // here" are opposite answers and must not share one. The player waits for
    // the first and moves on from the second; collapsing them into a single
    // falsy `isStarted` made a duplicate request — which React's StrictMode
    // guarantees in development — end the round after its first question.
    const status = Trivia.isRoundInProgress(roomId, queueId)
      ? 'inProgress'
      : Trivia.startRound(sock.server, roomId, queueId)
        ? 'started'
        : 'unavailable'

    acknowledge({
      type: TRIVIA_REQ_ROUND + '_SUCCESS',
      payload: { queueId, status },
    })
  },
  // Anyone in the room may answer, singer or not — giving the quiet guests
  // something to play is the point, so this deliberately does not check for a
  // queue entry.
  [TRIVIA_ANSWER]: (sock, { payload }, acknowledge) => {
    try {
      Trivia.answer({
        roomId: sock.user.roomId,
        userId: sock.user.userId,
        roundId: payload.roundId,
        answerIdx: payload.answerIdx,
      })
    } catch (err) {
      return acknowledge({
        type: TRIVIA_ANSWER + _ERROR,
        error: err.message,
      })
    }

    acknowledge({ type: TRIVIA_ANSWER + '_SUCCESS' })
  },
  // The roomId is in the payload rather than taken from the socket: an admin
  // resets scores from Settings > Rooms, where the room being edited is very
  // often not the room they are signed into.
  [TRIVIA_SCORES_RESET]: (sock, { payload }, acknowledge) => {
    const roomId = payload?.roomId ?? sock.user.roomId

    if (!sock.user.isAdmin || typeof roomId !== 'number') {
      return acknowledge({
        type: TRIVIA_SCORES_RESET + _ERROR,
        error: 'Unauthorized',
      })
    }

    Trivia.resetScores(roomId)
    acknowledge({ type: TRIVIA_SCORES_RESET + '_SUCCESS' })
  },
}

export default ACTION_HANDLERS
