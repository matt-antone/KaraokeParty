import sql from 'sqlate'
import { db } from '../lib/Database.js'
import getLogger from '../lib/Log.js'
import Rooms from '../Rooms/Rooms.js'
import Queue from '../Queue/Queue.js'
import QuestionCache, { type CachedQuestion } from './QuestionCache.js'
import {
  clampTriviaCountdown,
  TRIVIA_ANSWER_COUNT,
  TRIVIA_COUNTDOWN_DEFAULT,
  TRIVIA_QUESTIONS_PER_ROUND,
  type TriviaResult,
  type TriviaRound,
  type TriviaScore,
} from '../../shared/types.js'
import { TRIVIA_ROUND, TRIVIA_RESULT, QUEUE_PUSH } from '../../shared/actionTypes.js'

const log = getLogger('Trivia')

/** How long the right answer stays up, every question. Long enough to read
 *  which one it was, short enough that five of them do not become the party. */
const REVEAL_MS = 4000

/** After the last answer, the scoreboard gets the stage to itself. Sequenced
 *  rather than shown alongside: the answer and the standings are two different
 *  things to look at, and together they compete. */
const SCOREBOARD_MS = 6000

/** One question inside a round: its own id, so an answer can never be applied
 *  to the question after it. */
interface ActiveQuestion {
  roundId: number
  correctIdx: number
  /** Public payload, already shuffled — exactly what the room was sent. */
  round: TriviaRound
  /** userId to the index they chose. One answer each, first one counts. */
  answered: Map<number, number>
}

/** A round: several questions asked back to back on one queue row. */
interface ActiveRound {
  /** The queue row being asked. A round is a turn in the rotation, so it
   *  belongs to a row the whole room can see coming. */
  queueId: number
  questions: CachedQuestion[]
  /** Index into questions of the one in play, or about to be. */
  index: number
  /** Null between questions, while the answer is on screen. */
  current: ActiveQuestion | null
  timer: ReturnType<typeof setTimeout> | null
}

/** roomId to its round in progress. The server is the only place this can
 *  live: two clients racing must not be able to start two rounds. */
const rounds = new Map<number, ActiveRound>()

let nextRoundId = 1

function shuffle<T> (items: T[]): T[] {
  const out = [...items]

  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }

  return out
}

class Trivia {
  /** A room's trivia prefs, defaulted. Rooms created before trivia existed
   *  carry no key at all, which reads as off — the right default. */
  static getPrefs (roomId: number): { isEnabled: boolean, countdownSeconds: number } {
    const prefs = Rooms.get(roomId, { status: ['open', 'closed'] }).entities[roomId]?.prefs?.trivia

    return {
      isEnabled: !!prefs?.isEnabled,
      countdownSeconds: clampTriviaCountdown(prefs?.countdownSeconds ?? TRIVIA_COUNTDOWN_DEFAULT),
    }
  }

  /**
   * Keep the room's queue holding exactly one round that has not been asked
   * yet — one when trivia is on, none when it is off. Safe to call whenever
   * anything that could change the answer changes: it compares and acts.
   *
   * Returns true when the queue actually changed, so the caller knows whether
   * the room needs telling.
   */
  static syncQueue (roomId: number): boolean {
    if (this.getPrefs(roomId).isEnabled) {
      const pending = Queue.getPendingTriviaId(roomId)
      if (pending !== null) return false

      // nothing to take a turn between: a round on its own in an empty queue
      // would start the moment anyone pressed play
      const query = sql`SELECT COUNT(*) AS count FROM queue WHERE roomId = ${roomId} AND type = 'song'`
      if ((db.get<{ count: number }>(String(query), query.parameters)?.count ?? 0) === 0) return false

      Queue.addTrivia(roomId)
      return true
    }

    if (Queue.getPendingTriviaId(roomId) === null) return false

    Queue.removePendingTrivia(roomId)
    this.stopRoom(roomId)
    return true
  }

  /** Sync the queue and tell the room, when there is anything to tell. */
  static syncQueueAndPush (io, roomId: number): void {
    if (this.syncQueue(roomId)) {
      io.to(Rooms.prefix(roomId)).emit('action', {
        type: QUEUE_PUSH,
        payload: Queue.get(roomId),
      })
    }
  }

  /**
   * Is this queue row's round under way — including between its questions,
   * while an answer is on screen?
   *
   * Distinct from getRound, which is null during a reveal. The player asks
   * this to tell "someone already started this row" from "there is nothing to
   * play here", and those two must never be confused: the first means wait,
   * the second means move on.
   */
  static isRoundInProgress (roomId: number, queueId: number): boolean {
    return rounds.get(roomId)?.queueId === queueId
  }

  /** The question a room is in the middle of, for a client that just joined. */
  static getRound (roomId: number): TriviaRound | null {
    const active = rounds.get(roomId)?.current
    return active && active.round.endsAt > Date.now() ? active.round : null
  }

  /**
   * The player has reached a trivia row: start its round.
   *
   * Idempotent twice over. A second call while a round is running is a no-op,
   * so two clients racing cannot start two rounds; and a queueId that is not
   * the pending round is refused, so a player that reloads and replays its way
   * back through the queue does not ask a round the room already answered.
   */
  static startRound (io, roomId: number, queueId: number): TriviaRound | null {
    if (rounds.has(roomId)) return null
    if (Queue.getPendingTriviaId(roomId) !== queueId) return null

    // Fewer than a full round is still a round — a thin cache asks what it
    // has rather than nothing at all.
    const questions = QuestionCache.take(TRIVIA_QUESTIONS_PER_ROUND)

    // The cache is dry and the network is gone. Leave the row pending and say
    // nothing: the player skips past it, and the next time it comes round
    // there may be questions again. A party mid-song is the wrong place for an
    // error message.
    if (!questions.length) {
      log.verbose('no cached trivia questions; skipping this round')
      void QuestionCache.topUp()
      return null
    }

    rounds.set(roomId, { queueId, questions, index: -1, current: null, timer: null })

    // asked, so it can never be asked again — this is what a player reload
    // walking back through the queue would otherwise do
    Queue.setTriviaPlayed(queueId)

    // refill while the room is busy answering, not while it is waiting
    void QuestionCache.topUp()

    return this.askQuestion(io, roomId)
  }

  /** Put the next question of the round in front of the room. */
  static askQuestion (io, roomId: number): TriviaRound | null {
    const active = rounds.get(roomId)
    if (!active) return null

    // the reveal timer that would have called this; clearing it means asking
    // early (as the tests do) cannot leave a second one armed behind us
    if (active.timer) clearTimeout(active.timer)

    active.index++

    const question = active.questions[active.index]
    if (!question) return null

    const answers = shuffle([question.correctAnswer, ...question.incorrectAnswers])
    const { countdownSeconds } = this.getPrefs(roomId)

    const round: TriviaRound = {
      roundId: nextRoundId++,
      queueId: active.queueId,
      questionNumber: active.index + 1,
      questionCount: active.questions.length,
      question: question.question,
      answers,
      difficulty: question.difficulty,
      endsAt: Date.now() + countdownSeconds * 1000,
    }

    active.current = {
      roundId: round.roundId,
      correctIdx: answers.indexOf(question.correctAnswer),
      round,
      answered: new Map(),
    }
    active.timer = setTimeout(() => this.closeQuestion(io, roomId), countdownSeconds * 1000)

    io.to(Rooms.prefix(roomId)).emit('action', {
      type: TRIVIA_ROUND,
      payload: round,
    })

    return round
  }

  /**
   * Answering closed on the question in play: tell the room what was right,
   * then either move on to the next question or end the round.
   */
  static closeQuestion (io, roomId: number): void {
    const active = rounds.get(roomId)
    if (!active?.current) return

    if (active.timer) clearTimeout(active.timer)

    const { current } = active
    const isFinal = active.index >= active.questions.length - 1

    const payload: TriviaResult = {
      roundId: current.roundId,
      queueId: active.queueId,
      questionNumber: current.round.questionNumber,
      questionCount: current.round.questionCount,
      isFinal,
      correctIdx: current.correctIdx,
      // the scoreboard is the last question's payoff, but the scores ride
      // along every time so a client joining late is never without them
      scores: this.getScores(roomId),
      scoresFrom: Date.now() + REVEAL_MS,
      endsAt: Date.now() + REVEAL_MS + (isFinal ? SCOREBOARD_MS : 0),
    }

    active.current = null

    io.to(Rooms.prefix(roomId)).emit('action', {
      type: TRIVIA_RESULT,
      payload,
    })

    if (isFinal) {
      active.timer = null
      rounds.delete(roomId)

      // and the next round takes its place in the rotation, so there is
      // always exactly one waiting
      this.syncQueueAndPush(io, roomId)
      return
    }

    active.timer = setTimeout(() => this.askQuestion(io, roomId), REVEAL_MS)
  }

  /**
   * End the whole round now, whichever question it is on. Used when the room
   * stops caring — trivia switched off, the room closed — and by the tests to
   * drive a round to its end without waiting out five countdowns.
   */
  static closeRound (io, roomId: number): void {
    const active = rounds.get(roomId)
    if (!active) return

    // jump to the last question so the close is final
    active.index = active.questions.length - 1

    if (active.current) {
      this.closeQuestion(io, roomId)
      return
    }

    if (active.timer) clearTimeout(active.timer)
    rounds.delete(roomId)
    this.syncQueueAndPush(io, roomId)
  }

  /**
   * Record an answer. First one counts — a guest cannot walk their way to the
   * right key — and a round that has closed takes none at all.
   */
  static answer ({ roomId, userId, roundId, answerIdx }: {
    roomId: number
    userId: number
    roundId: number
    answerIdx: number
  }): void {
    const current = rounds.get(roomId)?.current

    // Matched on the question's own id, not the room's: between questions
    // there is nothing open, and a tap that lands during the reveal must not
    // be applied to the question that follows it.
    if (!current || current.roundId !== roundId) throw new Error('That question has closed')
    if (current.answered.has(userId)) throw new Error('You have already answered')

    if (!Number.isInteger(answerIdx) || answerIdx < 0 || answerIdx >= TRIVIA_ANSWER_COUNT) {
      throw new Error('Invalid answer')
    }

    current.answered.set(userId, answerIdx)

    const isCorrect = answerIdx === current.correctIdx
    const query = sql`
      INSERT INTO triviaScores (roomId, userId, score, numAnswered)
      VALUES (${roomId}, ${userId}, ${isCorrect ? 1 : 0}, 1)
      ON CONFLICT (roomId, userId) DO UPDATE SET
        score = score + ${isCorrect ? 1 : 0},
        numAnswered = numAnswered + 1
    `
    db.run(String(query), query.parameters)
  }

  /** Everyone who has answered at least once in this room, best first.
   *  Nobody who has not played appears, which is the whole rule. */
  static getScores (roomId: number): TriviaScore[] {
    const query = sql`
      SELECT triviaScores.userId, users.name, score, numAnswered
      FROM triviaScores
        INNER JOIN users USING(userId)
      WHERE roomId = ${roomId}
      ORDER BY score DESC, numAnswered ASC, users.name ASC
    `
    return db.all<TriviaScore>(String(query), query.parameters)
  }

  static resetScores (roomId: number): void {
    const query = sql`DELETE FROM triviaScores WHERE roomId = ${roomId}`
    db.run(String(query), query.parameters)
  }

  /** Drop a room's round and lap count — it closed, or trivia was turned off
   *  under it. Leaves scores alone; those are reset deliberately. */
  static stopRoom (roomId: number): void {
    const active = rounds.get(roomId)
    if (active?.timer) clearTimeout(active.timer)

    rounds.delete(roomId)
  }
}

export default Trivia
