export interface Artist {
  artistId: number
  name: string
  songIds: number[]
}

export interface Song {
  artistId: number
  duration: number
  songId: number
  title: string
  tags: string[]
  numMedia: number
}

/** Semitones a singer may shift a song either way. Six is a tritone: past it
 *  the shift is better spelled as the other direction, and every extra
 *  semitone costs phase-vocoder quality. */
export const KEY_CHANGE_MAX = 6

/** Clamp to a whole semitone inside the supported range. Both the socket
 *  handler and the stepper route through this so a hand-crafted payload
 *  cannot store a key the player would refuse to shift to. */
export const clampKeyChange = (n: number): number => (
  Number.isFinite(n) ? Math.max(-KEY_CHANGE_MAX, Math.min(KEY_CHANGE_MAX, Math.trunc(n))) : 0
)

/** What a queue row is. A trivia round takes a turn in the rotation just as a
 *  singer does, but has neither a singer nor anything to play — so the row
 *  carries its kind, and the fields a round has no use for come back as 0.
 *
 *  0 rather than null on the wire: every consumer that already filters by
 *  userId or looks a song up by songId keeps working untouched, because no
 *  user or song has id 0. The database stores real NULLs. */
export type QueueItemType = 'song' | 'trivia'

/** Rounds are told apart by this and nothing else — never by a missing song or
 *  an absent singer, which are consequences rather than the fact itself. */
export const isTriviaItem = (item?: { type?: QueueItemType }): boolean => item?.type === 'trivia'

export interface QueueItem {
  queueId: number
  type: QueueItemType
  /** 0 on a trivia round. */
  songId: number
  /** 0 on a trivia round. */
  userId: number
  /** Trivia rows only: the round has already been asked, in this session or a
   *  previous one. Play history lives in the running player and does not
   *  survive a reload, so without this a restarted player keeps landing on
   *  rounds the room has already had — and skips a turn on each. */
  isPlayed?: boolean
  prevQueueId: number
  /** Semitones to shift playback; 0 is the recording's own key. */
  keyChange: number
  mediaId: number
  rgTrackGain: number
  rgTrackPeak: number
  userDateUpdated: number
  userDisplayName: string
  mediaType: 'cdg' | 'mp4'
  isOptimistic?: false
  isVideoKeyingEnabled: boolean
}

export interface OptimisticQueueItem {
  isOptimistic: true
  type?: QueueItemType
  prevQueueId: number
  queueId: number
  songId: number
}

export interface SongHistoryItem {
  songId: number
  artist: string
  title: string
  dateSung: number
}

export interface IRoomPrefs {
  qr: {
    isEnabled: boolean
    opacity: number
    password: string
    size: number
  }
  trivia?: {
    isEnabled?: boolean
    /** How long an answer stays open, in seconds. */
    countdownSeconds?: number
  }
  user?: {
    isNewAllowed?: boolean
    isGuestAllowed?: boolean
  }
  roles?: Record<number, {
    allowNew: boolean
  }>
}

/** A room's transport, and the only gate on getting into it.
 *  - `play`     the room runs: singers join, queue up, and the player plays
 *  - `paused`   an intermission. Nobody new joins and nothing new is queued,
 *               and the player is stopped, but the queue and the scoreboard
 *               are exactly where the room left them
 *  - `stopped`  the night is over. Same gate as paused, and the queue and the
 *               scores are cleared when it is pressed
 *
 *  paused and stopped keep out the same people; the difference is entirely in
 *  what pressing stop threw away. */
export type RoomStatus = 'play' | 'paused' | 'stopped'

export const ROOM_STATUSES: RoomStatus[] = ['play', 'paused', 'stopped']

export interface Room {
  roomId: number
  name: string
  status: RoomStatus
  dateCreated: number
  hasPassword: boolean
  numUsers: number
  prefs?: IRoomPrefs
}

export interface Role {
  roleId: number
  name: string
}

export interface Path {
  pathId: number
  path: string
  priority: number
  /** Number of distinct songs with media under this path. */
  numSongs: number
  prefs: {
    isVideoKeyingEnabled: boolean
    isWatchingEnabled: boolean
  }
}

export interface User {
  userId: number
  username: string
  name: string
  isAdmin: boolean // todo: client and server ctx only
  isGuest: boolean // todo: client and server ctx only
  dateCreated: number
  dateUpdated: number
}

export interface UserWithRole extends User {
  role?: string
}

export interface PlaybackOptions {
  cdgAlpha?: number
  cdgSize?: number
  mp4Alpha?: number
  visualizer?: {
    sensitivity?: number
    isEnabled?: boolean
    nextPreset?: boolean
    prevPreset?: boolean
    randomPreset?: boolean
  }
}

export type MediaType = 'cdg' | 'mp4' | ''

export interface Prefs {
  isFirstRun?: boolean
  isScanning: boolean
  isReplayGainEnabled: boolean
  paths: {
    result: number[]
    entities: Record<number, Path>
  }
  roles: {
    result: number[]
    entities: Record<number, Role>
  }
  [key: string]: unknown
}

/** Answers per round. OpenTDB's type=multiple returns exactly one correct and
 *  three incorrect, which is where the four answer keys come from — this is a
 *  property of the source, not a layout choice, so it is not configurable. */
export const TRIVIA_ANSWER_COUNT = 4

/** Questions in one round. A round is a turn in the rotation, and one question
 *  is a thin turn — five is enough for the room to get into it and still hand
 *  the microphone back. Also the amount OpenTDB's own example fetches. */
export const TRIVIA_QUESTIONS_PER_ROUND = 5

/** Bounds on how long an answer stays open. Below the floor a guest cannot
 *  read four answers and reach for a key; above the ceiling the room is
 *  waiting on trivia rather than playing it. */
export const TRIVIA_COUNTDOWN_MIN = 5
export const TRIVIA_COUNTDOWN_MAX = 60
export const TRIVIA_COUNTDOWN_DEFAULT = 20

export const clampTriviaCountdown = (n: number): number => (
  Number.isFinite(n)
    ? Math.max(TRIVIA_COUNTDOWN_MIN, Math.min(TRIVIA_COUNTDOWN_MAX, Math.trunc(n)))
    : TRIVIA_COUNTDOWN_DEFAULT
)

/** A round in progress, as the room sees it. Deliberately carries no hint of
 *  which answer is right: the player screen and every phone get this same
 *  payload, and a client that knows the answer early is a client that can be
 *  made to show it. The correct index arrives in TriviaResult once answering
 *  has closed. */
export interface TriviaRound {
  /** Identifies one *question*. A round asks several, each with its own id,
   *  so an answer can never be applied to the wrong one. */
  roundId: number
  /** The queue row being asked. The player uses it to tell "my row's round"
   *  from one it has already seen through. */
  queueId: number
  /** 1-based, and how many the round holds — the room needs to know how far
   *  through it is. */
  questionNumber: number
  questionCount: number
  question: string
  /** Exactly TRIVIA_ANSWER_COUNT, already shuffled by the server. */
  answers: string[]
  difficulty: string
  /** Epoch ms the countdown expires. */
  endsAt: number
  /** Epoch ms this payload was sent, by the server's clock. Every other time
   *  here is the server's too, and the machines reading them — a TV box, a
   *  phone — have their own. Pairing the deadlines with the moment they were
   *  stamped lets a client subtract the difference out; without it a player
   *  whose clock is a few seconds off silently skips whole beats. */
  sentAt: number
}

/** The server's answer to "put this row's round on".
 *  - `started`      it just began; wait for it
 *  - `inProgress`   already under way on this row; wait for it
 *  - `unavailable`  no questions cached, or this row was already asked; move on
 *
 *  The first two are the same instruction and the third is its opposite, which
 *  is exactly why this is three named values rather than a boolean. */
export type TriviaRoundRequestStatus = 'started' | 'inProgress' | 'unavailable'

export interface TriviaScore {
  userId: number
  name: string
  score: number
  numAnswered: number
}

export interface TriviaResult {
  roundId: number
  queueId: number
  questionNumber: number
  questionCount: number
  /** The last question of the round: the scoreboard goes up, and the player
   *  moves on to the next singer once the reveal is over. */
  isFinal: boolean
  correctIdx: number
  /** Everyone who has answered at least once this room, best first. */
  scores: TriviaScore[]
  /** How many of the room got *this* question. The scoreboard says where the
   *  night stands; this is what the room reacts to out loud. */
  numCorrect: number
  /** Epoch ms the count takes over from the answer. Separate beats — you read
   *  what it was, then you see how the room did — because showing them at once
   *  means neither lands. Every question gets both. */
  scoresFrom: number
  /** Epoch ms the standings take over from the count, or null when there are
   *  no standings this question. Only the last one has them: it is the round's
   *  result rather than a checkpoint, so it earns a third beat and holds it
   *  twice as long. */
  boardFrom: number | null
  /** Epoch ms the reveal stops being shown — and, when isFinal, the earliest
   *  the next song may load. */
  endsAt: number
  /** Epoch ms this payload was sent. See TriviaRound.sentAt. */
  sentAt: number
}
