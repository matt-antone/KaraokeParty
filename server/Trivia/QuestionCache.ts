import sql from 'sqlate'
import { db } from '../lib/Database.js'
import getLogger from '../lib/Log.js'

const log = getLogger('Trivia')

/** Open Trivia Database, Entertainment: Music. No API key. */
const API = 'https://opentdb.com/api.php'
const TOKEN_API = 'https://opentdb.com/api_token.php'
const CATEGORY_MUSIC = 12

/** The most OpenTDB will return in one call. Parties run on a LAN that may
 *  have no internet, so the strategy is few large calls, early. */
const FETCH_AMOUNT = 50

/** One request per IP per five seconds, enforced by OpenTDB with response
 *  code 5. Held to with margin — a 429 costs a whole batch. */
const RATE_LIMIT_MS = 6000

/** Top up once the unplayed pile gets this thin. At one round per rotation
 *  lap this is a long way ahead of running out. */
const LOW_WATER = 20

interface OpenTdbResult {
  question: string
  correct_answer: string
  incorrect_answers: string[]
  difficulty: string
}

/** Both endpoints answer in this shape; the token call fills `token` and the
 *  question call fills `results`. response_code is the only field either one
 *  always sets, and it is what the caller branches on. */
interface OpenTdbResponse {
  response_code: number
  results?: OpenTdbResult[]
  token?: string
}

export interface CachedQuestion {
  questionId: number
  question: string
  correctAnswer: string
  incorrectAnswers: string[]
  difficulty: string
}

/** Session token, in memory only. It stops repeats *within a session* and
 *  expires after six hours of inactivity; the cache's unique index on the
 *  question and its dateUsed column are what actually stop repeats across a
 *  party, so losing this on restart costs nothing worth persisting for. */
let token: string | null = null
let lastRequestAt = 0
let isFetching = false

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** OpenTDB responses are HTML-entity encoded by default (&#039;, &quot;), so
 *  every call asks for base64 instead of shipping an entity decoder. */
const decode = (s: string) => Buffer.from(s, 'base64').toString('utf8')

async function request (url: string): Promise<OpenTdbResponse> {
  const since = Date.now() - lastRequestAt
  if (since < RATE_LIMIT_MS) await wait(RATE_LIMIT_MS - since)

  lastRequestAt = Date.now()
  const res = await fetch(url)

  if (!res.ok) throw new Error(`OpenTDB returned HTTP ${res.status}`)
  return await res.json()
}

async function requestToken (): Promise<string | null> {
  try {
    const json = await request(`${TOKEN_API}?command=request`)
    return json.response_code === 0 ? json.token ?? null : null
  } catch (err) {
    log.verbose('could not get a trivia session token: %s', (err as Error).message)
    return null
  }
}

class QuestionCache {
  /** Questions never played, in this room or any other. */
  static countUnplayed (): number {
    const query = sql`SELECT COUNT(*) AS count FROM triviaQuestions WHERE dateUsed IS NULL`
    return db.get<{ count: number }>(String(query), query.parameters)?.count ?? 0
  }

  static count (): number {
    const query = sql`SELECT COUNT(*) AS count FROM triviaQuestions`
    return db.get<{ count: number }>(String(query), query.parameters)?.count ?? 0
  }

  /**
   * The next `count` questions to ask: unplayed ones first, then the ones
   * played longest ago. A party that outlasts the music category keeps going
   * on repeats rather than stopping dead, which is the failure the room would
   * notice. Returns fewer than asked for when the cache is thin, and an empty
   * array only when it is completely empty.
   */
  static take (count: number): CachedQuestion[] {
    const query = sql`
      SELECT questionId, question, correctAnswer, incorrectAnswers, difficulty
      FROM triviaQuestions
      ORDER BY dateUsed IS NOT NULL, dateUsed ASC, RANDOM()
      LIMIT ${count}
    `
    const rows = db.all<{
      questionId: number
      question: string
      correctAnswer: string
      incorrectAnswers: string
      difficulty: string
    }>(String(query), query.parameters)

    if (!rows.length) return []

    // Marked used together rather than one at a time: a round asks all of
    // these, so a second room starting a round mid-way through this one must
    // not be handed the questions still to come in it.
    const ids = rows.map(row => row.questionId)
    const update = sql`
      UPDATE triviaQuestions
      SET dateUsed = ${Date.now()}
      WHERE questionId IN ${sql.tuple(ids)}
    `
    db.run(String(update), update.parameters)

    return rows.map(row => ({ ...row, incorrectAnswers: JSON.parse(row.incorrectAnswers) }))
  }

  /** Rows inserted, ignoring any question already cached. */
  static store (results: OpenTdbResult[]): number {
    let stored = 0

    for (const r of results) {
      const query = sql`
        INSERT OR IGNORE INTO triviaQuestions
          (question, correctAnswer, incorrectAnswers, difficulty, dateFetched)
        VALUES (
          ${decode(r.question)},
          ${decode(r.correct_answer)},
          ${JSON.stringify(r.incorrect_answers.map(decode))},
          ${decode(r.difficulty)},
          ${Date.now()}
        )
      `
      stored += db.run(String(query), query.parameters).changes
    }

    return stored
  }

  /**
   * Fetch a batch and cache it. Safe to call whenever — it returns early if
   * the pile is deep enough or a fetch is already in flight, so callers do
   * not have to know the schedule.
   *
   * Never throws: a party with no internet is an expected state, not a fault,
   * and the room plays out of whatever is already cached.
   */
  static async topUp ({ force = false } = {}): Promise<void> {
    if (isFetching) return
    if (!force && this.countUnplayed() >= LOW_WATER) return

    isFetching = true

    try {
      if (!token) token = await requestToken()

      const url = `${API}?amount=${FETCH_AMOUNT}&category=${CATEGORY_MUSIC}&type=multiple`
        + `&encode=base64${token ? `&token=${token}` : ''}`

      let json = await request(url)

      // 3: the token expired (six hours idle). 4: this token has now seen
      // every music question there is. Both are fixed the same way, and the
      // retry is the one that matters — without it the cache silently stops
      // topping up for the rest of the night.
      if (json.response_code === 3 || json.response_code === 4) {
        log.verbose('trivia session token %s; getting a new one',
          json.response_code === 4 ? 'exhausted the music category' : 'expired')

        token = await requestToken()
        json = await request(`${API}?amount=${FETCH_AMOUNT}&category=${CATEGORY_MUSIC}&type=multiple`
          + `&encode=base64${token ? `&token=${token}` : ''}`)
      }

      if (json.response_code !== 0) {
        log.verbose('trivia fetch returned response_code %s', json.response_code)
        return
      }

      const stored = this.store(json.results ?? [])
      log.info('cached %s new trivia question(s) (%s total)', stored, this.count())
    } catch (err) {
      log.verbose('could not reach the trivia API: %s', (err as Error).message)
    } finally {
      isFetching = false
    }
  }
}

export default QuestionCache
