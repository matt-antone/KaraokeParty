import React, { useEffect } from 'react'
import clsx from 'clsx'
import AnswerKey, { type AnswerKeyState } from 'components/AnswerKey/AnswerKey'
import TriviaRail from 'components/TriviaRail/TriviaRail'
import TriviaTally from 'components/TriviaTally/TriviaTally'
import useNow from 'lib/useNow'
import serverNow from 'lib/serverNow'
import type { TriviaResult, TriviaRound } from 'shared/types'
import styles from './PlayerTrivia.css'

/** Scoreboard rows that fit the stage without shrinking the type. The rest of
 *  the room is still on the board, just below the fold of this screen. */
const SCOREBOARD_ROWS = 6

/** Served straight off the assets folder, the way index.html takes its icons —
 *  a sound played once needs no bundling. */
const CHEER = 'assets/audience-applause.mp3'
const GROAN = 'assets/losing-horns-1.mp3'

/* OpenTDB is CC BY-SA 4.0. The attribution is a licence obligation, so it
   rides on the screen the questions appear on, not only in the docs — which
   means every beat of the round, and one copy of it. */
const attribution = (
  <div className={clsx('silkscreen', styles.attribution)}>
    questions from opentdb.com - CC BY-SA 4.0
  </div>
)

interface PlayerTriviaProps {
  round: TriviaRound
  /** Set once answering has closed; switches the screen to the reveal. */
  result?: TriviaResult | null
  width: number
  height: number
}

/**
 * A trivia round on the TV. It takes the gap between two singers, so it is a
 * full takeover of the stage in the same way the intermission is.
 *
 * The four answers are the only place their text appears. The phones carry the
 * question and four numerals, never the answers, which is what makes the room
 * look up.
 *
 * The stage is read in one order, and it is laid out in that order: what this
 * is and how long is left along the top, the question in the middle at the
 * size the far sofa needs, the four keys under it. The clock used to be the
 * largest thing on the screen and sat below the answers, which put the loudest
 * element on the least important fact and made the room read bottom-up.
 */
const PlayerTrivia = ({ round, result, width, height }: PlayerTriviaProps) => {
  const tick = useNow()
  const scores = result?.scores ?? []
  const numCorrect = result?.numCorrect ?? 0

  // Three beats, never two at once: the question, then the answer, then the
  // standings. The scoreboard waits for its own moment because reading which
  // one was right and finding yourself on a list are different jobs.
  const isScoreboard = !!result && serverNow(result, tick) >= result.scoresFrom

  // The count lands with a noise, on the one machine in the room with
  // speakers. Keyed on the question rather than the beat so it fires once
  // when the tally arrives, not on every tick it stays up, and best-effort
  // throughout: a player that will not autoplay still shows the number.
  const isTally = isScoreboard && !result.isFinal
  useEffect(() => {
    if (!isTally) return
    void new Audio(numCorrect ? CHEER : GROAN).play().catch(() => {})
  }, [isTally, numCorrect, result?.roundId])

  const stateOf = (i: number): AnswerKeyState => {
    if (!result) return 'open'
    return i === result.correctIdx ? 'correct' : 'wrong'
  }

  // Between questions the room wants to know how it did, not where the night
  // stands — the standings have four more questions to settle and this beat
  // lasts three seconds. The last question keeps the board: that one *is* the
  // result.
  if (isScoreboard && !result.isFinal) {
    return (
      <div style={{ width, height }} className={styles.container}>
        <TriviaRail round={round} label='who got it' variant='player' />

        <div className={styles.stage}>
          <TriviaTally numCorrect={numCorrect} variant='player' />
        </div>

        {attribution}
      </div>
    )
  }

  if (isScoreboard) {
    return (
      <div style={{ width, height }} className={styles.container}>
        <TriviaRail round={round} label='scores' variant='player' />

        <div className={styles.stage}>
          {scores.length > 0
            ? (
                <div className={styles.scoreboard}>
                  {scores.slice(0, SCOREBOARD_ROWS).map((s, i) => (
                    <div key={s.userId} className={styles.scoreRow}>
                      <span className={styles.rank}>{String(i + 1).padStart(2, '0')}</span>
                      <span className={styles.scoreName} translate='no'>{s.name}</span>
                      <span className={styles.score}>{s.score}</span>
                    </div>
                  ))}
                </div>
              )
            : <div className={styles.question}>Nobody played</div>}
        </div>

        {attribution}
      </div>
    )
  }

  return (
    <div style={{ width, height }} className={styles.container}>
      <TriviaRail
        round={round}
        label={result ? 'answer' : 'trivia'}
        isRunning={!result}
        variant='player'
      />

      <div className={styles.stage}>
        <div className={styles.question} translate='no'>{round.question}</div>
      </div>

      <div className={styles.answers}>
        {round.answers.map((answer, i) => (
          <AnswerKey key={answer} index={i} label={answer} state={stateOf(i)} disabled />
        ))}
      </div>

      {attribution}
    </div>
  )
}

export default PlayerTrivia
