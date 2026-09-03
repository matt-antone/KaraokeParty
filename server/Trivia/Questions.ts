import getLogger from '../lib/Log.js'

const log = getLogger('Trivia')

/** Open Trivia Database, Entertainment: Music. No API key. */
const API = 'https://opentdb.com/api.php'
const TOKEN_API = 'https://opentdb.com/api_token.php'
const CATEGORY_MUSIC = 12

/** One request per IP per five seconds, enforced by OpenTDB with response
 *  code 5. Held to with margin. A round asks once and rounds are minutes
 *  apart, so this only ever matters if two rooms start together. */
const RATE_LIMIT_MS = 6000

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

export interface TriviaQuestion {
  question: string
  correctAnswer: string
  incorrectAnswers: string[]
  difficulty: string
}

/** Session token, in memory only. It is the whole repeat-protection now that
 *  nothing is stored: OpenTDB will not hand back a question this token has
 *  already seen. It expires after six hours idle, and a restart costs a
 *  night's memory of what was asked. */
let token: string | null = null
let lastRequestAt = 0

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

const questionUrl = (count: number) =>
  `${API}?amount=${count}&category=${CATEGORY_MUSIC}&type=multiple&encode=base64`
  + (token ? `&token=${token}` : '')

/**
 * A round's questions, fetched when the round starts.
 *
 * Never throws: a party on a LAN with no internet is an expected state, not a
 * fault. An empty array means "no round this time" and the player moves on to
 * the next singer, which is the right thing for the room — a gap that fills
 * itself beats an error nobody can act on mid-song.
 */
export default async function fetchQuestions (count: number): Promise<TriviaQuestion[]> {
  try {
    if (!token) token = await requestToken()

    let json = await request(questionUrl(count))

    // 3: the token expired (six hours idle). 4: this token has now seen every
    // music question there is. Both are fixed the same way, and without the
    // retry trivia silently stops for the rest of the night.
    if (json.response_code === 3 || json.response_code === 4) {
      log.verbose('trivia session token %s; getting a new one',
        json.response_code === 4 ? 'exhausted the music category' : 'expired')

      token = await requestToken()
      json = await request(questionUrl(count))
    }

    if (json.response_code !== 0) {
      log.verbose('trivia fetch returned response_code %s', json.response_code)
      return []
    }

    return (json.results ?? []).map(r => ({
      question: decode(r.question),
      correctAnswer: decode(r.correct_answer),
      incorrectAnswers: r.incorrect_answers.map(decode),
      difficulty: decode(r.difficulty),
    }))
  } catch (err) {
    log.verbose('could not reach the trivia API: %s', (err as Error).message)
    return []
  }
}
