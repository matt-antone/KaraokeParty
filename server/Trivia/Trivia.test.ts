import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db, open, close } from '../lib/Database.js'
import Trivia from './Trivia.js'
import QuestionCache from './QuestionCache.js'
import Queue from '../Queue/Queue.js'
import { QUEUE_PUSH, TRIVIA_RESULT, TRIVIA_ROUND } from '../../shared/actionTypes.js'
import { TRIVIA_QUESTIONS_PER_ROUND, type TriviaResult, type TriviaRound } from '../../shared/types.js'

const ROOM_ID = 1
const ALICE = 1
const BOB = 2
const CAROL = 3

interface Emitted { type: string, payload: TriviaRound | TriviaResult | unknown }

/** Enough of socket.io's server to see what the room was told. */
function fakeIo () {
  const emitted: Emitted[] = []
  return { emitted, to: () => ({ emit: (_e: string, action: Emitted) => emitted.push(action) }) }
}

const user = (userId: number, name: string) =>
  db.run(`INSERT INTO users (userId, username, password, name, roleId)
    VALUES (?, ?, 'x', ?, (SELECT roleId FROM roles WHERE name = 'standard'))`, [userId, name.toLowerCase(), name])

const setTriviaPrefs = (prefs: object) =>
  db.run('UPDATE rooms SET data = ? WHERE roomId = ?', [JSON.stringify({ prefs: { trivia: prefs } }), ROOM_ID])

const addQuestion = (question: string, correct = 'right') =>
  db.run(`INSERT INTO triviaQuestions (question, correctAnswer, incorrectAnswers, difficulty, dateFetched)
    VALUES (?, ?, ?, 'easy', 0)`, [question, correct, JSON.stringify(['w1', 'w2', 'w3'])])

/** Queue a song so the room has singers to derive a lap length from. */
const queueSong = (userId: number) =>
  db.run('INSERT INTO queue (roomId, songId, userId) VALUES (?, 10, ?)', [ROOM_ID, userId])

/** A fresh in-memory database holding one open room with trivia on, three
 *  users and one cached question. Module state outlives the database between
 *  tests, so the round is cleared here too. */
function setupRoom () {
  close()
  open({ file: ':memory:', ro: false })

  db.run('INSERT INTO rooms (roomId, name, status) VALUES (?, ?, ?)', [ROOM_ID, 'Room', 'open'])
  user(ALICE, 'Alice')
  user(BOB, 'Bob')
  user(CAROL, 'Carol')
  db.run('INSERT INTO artists (artistId, name, nameNorm) VALUES (1, ?, ?)', ['Eurythmics', 'eurythmics'])
  db.run('INSERT INTO songs (songId, artistId, title, titleNorm) VALUES (10, 1, ?, ?)', ['Sweet Dreams', 'sweet dreams'])
  db.run('INSERT INTO paths (pathId, path, priority, data) VALUES (1, ?, 1, ?)', ['/media', '{}'])
  db.run('INSERT INTO media (mediaId, songId, pathId, relPath, duration, isPreferred) VALUES (100, 10, 1, ?, 60, 1)', ['a.mp4'])

  setTriviaPrefs({ isEnabled: true, countdownSeconds: 20 })
  addQuestion('Who?')
  Trivia.stopRoom(ROOM_ID)
}

function teardownRoom () {
  Trivia.stopRoom(ROOM_ID)
  close()
}

describe('trivia rounds', () => {
  beforeEach(setupRoom)
  afterEach(teardownRoom)

  it('stays out of the way while trivia is off', () => {
    setTriviaPrefs({ isEnabled: false })
    queueSong(ALICE)

    expect(Trivia.syncQueue(ROOM_ID)).toBe(false)
    expect(Queue.getPendingTriviaId(ROOM_ID)).toBeNull()
  })

  it('puts a round in the queue once the room has something to sing', () => {
    // nothing to take a turn between yet
    expect(Trivia.syncQueue(ROOM_ID)).toBe(false)
    expect(Queue.getPendingTriviaId(ROOM_ID)).toBeNull()

    queueSong(ALICE)
    expect(Trivia.syncQueue(ROOM_ID)).toBe(true)
    expect(Queue.getPendingTriviaId(ROOM_ID)).not.toBeNull()
  })

  it('keeps exactly one round waiting, however many callers ask', () => {
    queueSong(ALICE)

    const first = Trivia.syncQueue(ROOM_ID)
    const pending = Queue.getPendingTriviaId(ROOM_ID)

    expect(first).toBe(true)
    expect(Trivia.syncQueue(ROOM_ID)).toBe(false)
    expect(Trivia.syncQueue(ROOM_ID)).toBe(false)
    expect(Queue.addTrivia(ROOM_ID)).toBe(pending)

    const rows = db.all<{ n: number }>(
      'SELECT COUNT(*) AS n FROM queue WHERE roomId = ? AND type = \'trivia\'', [ROOM_ID])
    expect(rows[0].n).toBe(1)
  })

  it('takes the waiting round back out when trivia is switched off', () => {
    queueSong(ALICE)
    Trivia.syncQueue(ROOM_ID)

    setTriviaPrefs({ isEnabled: false })
    expect(Trivia.syncQueue(ROOM_ID)).toBe(true)
    expect(Queue.getPendingTriviaId(ROOM_ID)).toBeNull()
    // the singer's song is untouched
    expect(Queue.get(ROOM_ID).result).toHaveLength(1)
  })

  it('leaves a round that was already played in the queue when switched off', () => {
    queueSong(ALICE)
    const pending = Trivia.syncQueue(ROOM_ID) && Queue.getPendingTriviaId(ROOM_ID)!
    Trivia.startRound(fakeIo(), ROOM_ID, pending as number)

    setTriviaPrefs({ isEnabled: false })
    Trivia.syncQueue(ROOM_ID)

    // it is part of what the room did tonight, not a pending obligation
    expect(Queue.get(ROOM_ID).result).toContain(pending)
  })

  it('shows the round in the queue with no singer and no song', () => {
    queueSong(ALICE)
    Trivia.syncQueue(ROOM_ID)

    const { result, entities } = Queue.get(ROOM_ID)
    const trivia = result.map(id => entities[id]).find(e => e.type === 'trivia')!

    expect(trivia).toBeDefined()
    expect(trivia.userId).toBe(0)
    expect(trivia.songId).toBe(0)
    expect(trivia.mediaType).toBeNull()
    expect(trivia.userDisplayName).toBe('Trivia')
    // and it sits behind the song that was queued before it
    expect(result.indexOf(trivia.queueId)).toBe(1)
  })

  it('still hides a song whose media has gone, now the join is a LEFT one', () => {
    queueSong(ALICE)
    db.run('INSERT INTO songs (songId, artistId, title, titleNorm) VALUES (11, 1, ?, ?)', ['No Media', 'no media'])
    db.run('INSERT INTO queue (roomId, songId, userId, prevQueueId) VALUES (?, 11, ?, ?)',
      [ROOM_ID, ALICE, Queue.get(ROOM_ID).result.at(-1)])

    // the unplayable row is not in the queue the room is shown
    expect(Queue.get(ROOM_ID).result).toHaveLength(1)
  })

  it('asks the round on the row the player has reached', () => {
    queueSong(ALICE)
    Trivia.syncQueue(ROOM_ID)
    const queueId = Queue.getPendingTriviaId(ROOM_ID)!

    const io = fakeIo()
    const round = Trivia.startRound(io, ROOM_ID, queueId)

    expect(round?.queueId).toBe(queueId)
    expect(io.emitted[0].type).toBe(TRIVIA_ROUND)
  })

  it('refuses to ask a row that is not the one waiting', () => {
    queueSong(ALICE)
    Trivia.syncQueue(ROOM_ID)
    const queueId = Queue.getPendingTriviaId(ROOM_ID)!

    const io = fakeIo()
    expect(Trivia.startRound(io, ROOM_ID, queueId + 999)).toBeNull()
    expect(io.emitted).toEqual([])
  })

  it('never asks the same row twice, however the player gets back to it', () => {
    queueSong(ALICE)
    Trivia.syncQueue(ROOM_ID)
    const queueId = Queue.getPendingTriviaId(ROOM_ID)!

    expect(Trivia.startRound(fakeIo(), ROOM_ID, queueId)).not.toBeNull()
    Trivia.closeRound(fakeIo(), ROOM_ID)

    // a player that reloads and replays its way back must not re-ask it
    expect(Trivia.startRound(fakeIo(), ROOM_ID, queueId)).toBeNull()
  })

  it('puts the next round at the back of the queue as one finishes', () => {
    queueSong(ALICE)
    Trivia.syncQueue(ROOM_ID)
    const first = Queue.getPendingTriviaId(ROOM_ID)!

    Trivia.startRound(fakeIo(), ROOM_ID, first)
    expect(Queue.getPendingTriviaId(ROOM_ID)).toBeNull() // asked, so no longer waiting

    Trivia.closeRound(fakeIo(), ROOM_ID)

    const next = Queue.getPendingTriviaId(ROOM_ID)
    expect(next).not.toBeNull()
    expect(next).not.toBe(first)
  })

  it('never runs two rounds at once, however many callers ask', () => {
    queueSong(ALICE)
    Trivia.syncQueue(ROOM_ID)
    const queueId = Queue.getPendingTriviaId(ROOM_ID)!
    const io = fakeIo()

    expect(Trivia.startRound(io, ROOM_ID, queueId)).not.toBeNull()
    expect(Trivia.startRound(io, ROOM_ID, queueId)).toBeNull()
    expect(Trivia.startRound(io, ROOM_ID, queueId)).toBeNull()
    expect(io.emitted).toHaveLength(1)
  })

  it('sends the room four shuffled answers and no hint of which is right', () => {
    const round = startPendingRound()

    expect(round?.answers).toHaveLength(4)
    expect(round?.answers).toEqual(expect.arrayContaining(['right', 'w1', 'w2', 'w3']))
    expect(JSON.stringify(round)).not.toContain('correctIdx')
  })

  it('says nothing at all when the cache is dry, leaving the row to try again', () => {
    queueSong(ALICE)
    Trivia.syncQueue(ROOM_ID)
    const queueId = Queue.getPendingTriviaId(ROOM_ID)!
    db.run('DELETE FROM triviaQuestions')
    const io = fakeIo()

    expect(Trivia.startRound(io, ROOM_ID, queueId)).toBeNull()
    expect(io.emitted).toEqual([])
    // still waiting, so a later round can use it once questions arrive
    expect(Queue.getPendingTriviaId(ROOM_ID)).toBe(queueId)
  })

  /** Ask whichever round is waiting, queueing one first if needed. */
  const startPendingRound = () => {
    if (Queue.getPendingTriviaId(ROOM_ID) === null) {
      queueSong(ALICE)
      Trivia.syncQueue(ROOM_ID)
    }
    return Trivia.startRound(fakeIo(), ROOM_ID, Queue.getPendingTriviaId(ROOM_ID)!)
  }

  /** Play a round through to its close and hand back the question asked. */
  const playRound = () => {
    const round = startPendingRound()
    Trivia.closeRound(fakeIo(), ROOM_ID)
    return round
  }

  /** Every question a whole round asks, in order. */
  const collectRound = (): string[] => {
    const first = startPendingRound()
    if (!first) return []

    const asked = [first.question]

    for (let i = 1; i < first.questionCount; i++) {
      Trivia.closeQuestion(fakeIo(), ROOM_ID)
      const next = Trivia.askQuestion(fakeIo(), ROOM_ID)
      if (next) asked.push(next.question)
    }

    Trivia.closeRound(fakeIo(), ROOM_ID)
    return asked
  }

  it('marks a whole round used so the next one asks different questions', () => {
    // two full rounds' worth, so the second can be entirely fresh. Asserting
    // on the sets rather than on the first question of each: within a round
    // the order is randomised, so comparing one question to one question is a
    // coin flip rather than a test.
    for (let i = 0; i < TRIVIA_QUESTIONS_PER_ROUND * 2; i++) addQuestion(`q${i}`)

    const first = collectRound()
    const second = collectRound()

    expect(first).toHaveLength(TRIVIA_QUESTIONS_PER_ROUND)
    expect(second).toHaveLength(TRIVIA_QUESTIONS_PER_ROUND)
    expect(first.filter(q => second.includes(q))).toEqual([])
  })

  it('falls back to the longest-unseen question rather than stopping', () => {
    // one question, two rounds: a party outlasting the category repeats it
    // rather than the room finding trivia has quietly stopped happening
    const first = playRound()
    const second = playRound()

    expect(second?.question).toBe(first?.question)
    expect(second?.roundId).not.toBe(first?.roundId)
  })
})

describe('trivia answers and scores', () => {
  let correctIdx: number
  let roundId: number

  beforeEach(() => {
    setupRoom()

    db.run('INSERT INTO queue (roomId, songId, userId) VALUES (?, 10, ?)', [ROOM_ID, ALICE])
    Trivia.syncQueue(ROOM_ID)

    const round = Trivia.startRound(fakeIo(), ROOM_ID, Queue.getPendingTriviaId(ROOM_ID)!)!
    roundId = round.roundId
    correctIdx = round.answers.indexOf('right')
  })

  afterEach(teardownRoom)

  const answer = (userId: number, answerIdx: number) =>
    Trivia.answer({ roomId: ROOM_ID, userId, roundId, answerIdx })

  it('scores a right answer and still counts a wrong one as played', () => {
    answer(ALICE, correctIdx)
    answer(BOB, (correctIdx + 1) % 4)

    expect(Trivia.getScores(ROOM_ID)).toEqual([
      { userId: ALICE, name: 'Alice', score: 1, numAnswered: 1 },
      { userId: BOB, name: 'Bob', score: 0, numAnswered: 1 },
    ])
  })

  it('takes the first answer only, so nobody can walk to the right key', () => {
    answer(ALICE, (correctIdx + 1) % 4)
    expect(() => answer(ALICE, correctIdx)).toThrow(/already answered/)

    expect(Trivia.getScores(ROOM_ID)[0].score).toBe(0)
  })

  it('refuses an answer to a round that has closed', () => {
    Trivia.closeRound(fakeIo(), ROOM_ID)
    expect(() => answer(ALICE, correctIdx)).toThrow(/closed/)
  })

  it('refuses an answer to some other round', () => {
    expect(() => Trivia.answer({ roomId: ROOM_ID, userId: ALICE, roundId: roundId + 99, answerIdx: 0 }))
      .toThrow(/closed/)
  })

  it('refuses a key that is not one of the four', () => {
    expect(() => answer(ALICE, 4)).toThrow(/Invalid answer/)
    expect(() => answer(ALICE, -1)).toThrow(/Invalid answer/)
    expect(Trivia.getScores(ROOM_ID)).toEqual([])
  })

  it('leaves everyone who has not played off the scoreboard', () => {
    answer(ALICE, correctIdx)

    const scores = Trivia.getScores(ROOM_ID)
    expect(scores).toHaveLength(1)
    expect(scores.map(s => s.name)).not.toContain('Carol')
  })

  it('puts the best first, and the one who got there in fewer goes ahead', () => {
    answer(ALICE, (correctIdx + 1) % 4)
    answer(BOB, correctIdx)
    answer(CAROL, correctIdx)
    Trivia.closeRound(fakeIo(), ROOM_ID)

    // Carol sits out the second round, so Bob answers twice for the same score
    const second = Trivia.startRound(fakeIo(), ROOM_ID, Queue.getPendingTriviaId(ROOM_ID)!)!
    Trivia.answer({ roomId: ROOM_ID, userId: BOB, roundId: second.roundId, answerIdx: (second.answers.indexOf('right') + 1) % 4 })

    expect(Trivia.getScores(ROOM_ID).map(s => s.name)).toEqual(['Carol', 'Bob', 'Alice'])
  })

  it('tells the room what was right only once answering has closed', () => {
    const io = fakeIo()
    answer(ALICE, correctIdx)
    Trivia.closeRound(io, ROOM_ID)

    // the result, and then the queue carrying the next round
    expect(io.emitted.map(e => e.type)).toEqual([TRIVIA_RESULT, QUEUE_PUSH])
    const result = io.emitted[0].payload as TriviaResult
    expect(result.correctIdx).toBe(correctIdx)
    expect(result.scores[0].name).toBe('Alice')
    expect(Trivia.getRound(ROOM_ID)).toBeNull()
  })

  it('closing twice tells the room once', () => {
    const io = fakeIo()
    Trivia.closeRound(io, ROOM_ID)
    Trivia.closeRound(io, ROOM_ID)

    expect(io.emitted.filter(e => e.type === TRIVIA_RESULT)).toHaveLength(1)
  })

  it('resets the scoreboard without touching the cached questions', () => {
    answer(ALICE, correctIdx)
    Trivia.resetScores(ROOM_ID)

    expect(Trivia.getScores(ROOM_ID)).toEqual([])
    expect(QuestionCache.count()).toBe(1)
  })
})

describe('the question cache', () => {
  beforeEach(() => {
    close()
    open({ file: ':memory:', ro: false })
  })

  afterEach(close)

  it('decodes what the API sends and ignores what it already has', () => {
    const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64')
    const result = {
      question: b64('Who wrote "Purple Rain"?'),
      correct_answer: b64('Prince'),
      incorrect_answers: [b64('Sting'), b64('Bowie'), b64('Cher')],
      difficulty: b64('medium'),
    }

    expect(QuestionCache.store([result])).toBe(1)
    // the same question again is not a second row: OpenTDB has no stable id,
    // so the question text is the key a top-up dedupes on
    expect(QuestionCache.store([result])).toBe(0)
    expect(QuestionCache.count()).toBe(1)

    const [taken] = QuestionCache.take(1)
    expect(taken.question).toBe('Who wrote "Purple Rain"?')
    expect(taken.correctAnswer).toBe('Prince')
    expect(taken.incorrectAnswers).toEqual(['Sting', 'Bowie', 'Cher'])
    expect(taken.difficulty).toBe('medium')
  })

  it('spends every unplayed question before repeating any', () => {
    for (const q of ['a', 'b', 'c']) addQuestion(q)

    const taken = QuestionCache.take(3)
    expect(taken.map(t => t.question).sort()).toEqual(['a', 'b', 'c'])
    expect(QuestionCache.countUnplayed()).toBe(0)
  })

  it('comes back to the question seen longest ago once none are unplayed', () => {
    for (const q of ['a', 'b', 'c']) addQuestion(q)

    // Stamped rather than played three times over: take() marks with
    // Date.now(), three calls land in one millisecond, and the tie is broken
    // by RANDOM() — which is right in a party, where rounds are minutes
    // apart, and a coin flip in a test. This asserts the ordering rule.
    db.run('UPDATE triviaQuestions SET dateUsed = 3000 WHERE question = ?', ['a'])
    db.run('UPDATE triviaQuestions SET dateUsed = 1000 WHERE question = ?', ['b'])
    db.run('UPDATE triviaQuestions SET dateUsed = 2000 WHERE question = ?', ['c'])

    expect(QuestionCache.take(2).map(q => q.question)).toEqual(['b', 'c'])
  })

  it('prefers any unplayed question over the longest-unseen one', () => {
    addQuestion('old')
    addQuestion('fresh')
    db.run('UPDATE triviaQuestions SET dateUsed = 1 WHERE question = ?', ['old'])

    expect(QuestionCache.take(1)[0].question).toBe('fresh')
  })

  it('has nothing to give from an empty cache', () => {
    expect(QuestionCache.take(5)).toEqual([])
  })

  it('gives what it has when asked for more than it holds', () => {
    addQuestion('only one')
    // a thin cache asks a short round rather than no round at all
    expect(QuestionCache.take(5).map(q => q.question)).toEqual(['only one'])
  })

  it('marks a whole batch used at once', () => {
    for (const q of ['a', 'b', 'c']) addQuestion(q)
    QuestionCache.take(2)

    // the two it handed out are spoken for, so a second room starting a round
    // mid-way through this one cannot be given them again
    expect(QuestionCache.countUnplayed()).toBe(1)
  })
})

describe('a round of several questions', () => {
  const io = () => fakeIo()

  /** Start the round waiting on the room's pending trivia row. */
  const start = () => {
    queueSong(ALICE)
    Trivia.syncQueue(ROOM_ID)
    return Trivia.startRound(fakeIo(), ROOM_ID, Queue.getPendingTriviaId(ROOM_ID)!)!
  }

  beforeEach(() => {
    setupRoom()
    // one is seeded by setupRoom; a full round wants five
    for (const q of ['q2', 'q3', 'q4', 'q5', 'q6']) addQuestion(q)
  })

  afterEach(teardownRoom)

  it('asks five questions on one turn in the rotation', () => {
    const first = start()
    expect(first.questionNumber).toBe(1)
    expect(first.questionCount).toBe(TRIVIA_QUESTIONS_PER_ROUND)

    const asked = [first.question]

    for (let i = 2; i <= TRIVIA_QUESTIONS_PER_ROUND; i++) {
      Trivia.closeQuestion(io(), ROOM_ID)
      const next = Trivia.askQuestion(io(), ROOM_ID)!
      expect(next.questionNumber).toBe(i)
      asked.push(next.question)
    }

    // five different questions, and a fresh id for each so an answer can
    // never be applied to the one after it
    expect(new Set(asked).size).toBe(TRIVIA_QUESTIONS_PER_ROUND)
  })

  it('holds the queue row until the last question is done', () => {
    const first = start()
    const queueId = first.queueId

    // four reveals in, the row is still the round's and nothing new is waiting
    for (let i = 1; i < TRIVIA_QUESTIONS_PER_ROUND; i++) {
      const emitted = io()
      Trivia.closeQuestion(emitted, ROOM_ID)
      expect((emitted.emitted[0].payload as TriviaResult).isFinal).toBe(false)
      expect(Queue.getPendingTriviaId(ROOM_ID)).toBeNull()
      Trivia.askQuestion(io(), ROOM_ID)
    }

    const last = io()
    Trivia.closeQuestion(last, ROOM_ID)
    expect((last.emitted[0].payload as TriviaResult).isFinal).toBe(true)

    // only now does the next round join the rotation
    const next = Queue.getPendingTriviaId(ROOM_ID)
    expect(next).not.toBeNull()
    expect(next).not.toBe(queueId)
  })

  it('gives everyone a fresh answer on every question', () => {
    const first = start()
    Trivia.answer({ roomId: ROOM_ID, userId: ALICE, roundId: first.roundId, answerIdx: first.answers.indexOf('right') })

    Trivia.closeQuestion(io(), ROOM_ID)
    const second = Trivia.askQuestion(io(), ROOM_ID)!

    // answering the first must not lock anyone out of the second
    expect(() => Trivia.answer({ roomId: ROOM_ID, userId: ALICE, roundId: second.roundId, answerIdx: 0 })).not.toThrow()
    expect(Trivia.getScores(ROOM_ID)[0].numAnswered).toBe(2)
  })

  it('refuses an answer aimed at the question just gone', () => {
    const first = start()
    Trivia.closeQuestion(io(), ROOM_ID)
    Trivia.askQuestion(io(), ROOM_ID)

    // a tap that lands during the reveal must not score against the next one
    expect(() => Trivia.answer({ roomId: ROOM_ID, userId: ALICE, roundId: first.roundId, answerIdx: 0 }))
      .toThrow(/closed/)
  })

  it('takes nothing at all while the answer is on screen', () => {
    const first = start()
    Trivia.closeQuestion(io(), ROOM_ID)

    expect(() => Trivia.answer({ roomId: ROOM_ID, userId: ALICE, roundId: first.roundId, answerIdx: 0 }))
      .toThrow(/closed/)
  })

  it('asks a short round rather than none when the cache is thin', () => {
    db.run('DELETE FROM triviaQuestions WHERE question <> \'Who?\'')

    const only = start()
    expect(only.questionCount).toBe(1)

    const last = io()
    Trivia.closeQuestion(last, ROOM_ID)
    expect((last.emitted[0].payload as TriviaResult).isFinal).toBe(true)
  })

  it('shows the answer first and the scoreboard after it', () => {
    start()
    const emitted = io()

    for (let i = 1; i < TRIVIA_QUESTIONS_PER_ROUND; i++) {
      Trivia.closeQuestion(io(), ROOM_ID)
      Trivia.askQuestion(io(), ROOM_ID)
    }

    Trivia.closeQuestion(emitted, ROOM_ID)
    const result = emitted.emitted[0].payload as TriviaResult

    expect(result.isFinal).toBe(true)
    // the answer gets the stage on its own, then hands over to the standings
    expect(result.scoresFrom).toBeGreaterThan(Date.now())
    expect(result.endsAt).toBeGreaterThan(result.scoresFrom)
  })

  it('gives a question that is not the last no scoreboard beat at all', () => {
    start()
    const emitted = io()
    Trivia.closeQuestion(emitted, ROOM_ID)

    const result = emitted.emitted[0].payload as TriviaResult
    expect(result.isFinal).toBe(false)
    // nothing to hand over to: the next question follows the answer
    expect(result.scoresFrom).toBe(result.endsAt)
  })

  it('ends the whole round when the room stops caring', () => {
    start()
    const emitted = io()

    // trivia switched off mid-round: closeRound ends it there and then
    Trivia.closeRound(emitted, ROOM_ID)
    expect((emitted.emitted[0].payload as TriviaResult).isFinal).toBe(true)
    expect(Trivia.getRound(ROOM_ID)).toBeNull()
  })
})

/**
 * The bug this guards: the player asked for its round twice — React's
 * StrictMode double-invokes effects in development — and the second answer
 * said "not started", which the player read as "nothing here, move on". The
 * round then ended after its first question while the server went on
 * broadcasting the other four into a room that had stopped listening.
 */
describe('asking twice for the same round', () => {
  beforeEach(() => {
    setupRoom()
    for (const q of ['q2', 'q3', 'q4', 'q5', 'q6']) addQuestion(q)
    queueSong(ALICE)
    Trivia.syncQueue(ROOM_ID)
  })

  afterEach(teardownRoom)

  it('reports the second ask as in progress, never as unavailable', () => {
    const queueId = Queue.getPendingTriviaId(ROOM_ID)!

    expect(Trivia.isRoundInProgress(ROOM_ID, queueId)).toBe(false)
    expect(Trivia.startRound(fakeIo(), ROOM_ID, queueId)).not.toBeNull()

    // the duplicate: a round is running, so the row is emphatically not
    // "nothing to play"
    expect(Trivia.isRoundInProgress(ROOM_ID, queueId)).toBe(true)
    expect(Trivia.startRound(fakeIo(), ROOM_ID, queueId)).toBeNull()
  })

  it('still reports in progress between questions, while an answer is up', () => {
    const queueId = Queue.getPendingTriviaId(ROOM_ID)!
    Trivia.startRound(fakeIo(), ROOM_ID, queueId)
    Trivia.closeQuestion(fakeIo(), ROOM_ID)

    // getRound is null during the reveal, which is why the check cannot be
    // written in terms of it — that gap is where the player would bail
    expect(Trivia.getRound(ROOM_ID)).toBeNull()
    expect(Trivia.isRoundInProgress(ROOM_ID, queueId)).toBe(true)
  })

  it('reports unavailable only once the round has really finished', () => {
    const queueId = Queue.getPendingTriviaId(ROOM_ID)!
    Trivia.startRound(fakeIo(), ROOM_ID, queueId)
    Trivia.closeRound(fakeIo(), ROOM_ID)

    expect(Trivia.isRoundInProgress(ROOM_ID, queueId)).toBe(false)
    expect(Trivia.startRound(fakeIo(), ROOM_ID, queueId)).toBeNull()
  })

  it('reports unavailable for a row that has nothing to ask', () => {
    const queueId = Queue.getPendingTriviaId(ROOM_ID)!
    db.run('DELETE FROM triviaQuestions')

    expect(Trivia.isRoundInProgress(ROOM_ID, queueId)).toBe(false)
    expect(Trivia.startRound(fakeIo(), ROOM_ID, queueId)).toBeNull()
  })
})
