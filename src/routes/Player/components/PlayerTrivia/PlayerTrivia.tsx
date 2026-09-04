import React from 'react'
import clsx from 'clsx'
import AnswerKey, { type AnswerKeyState } from 'components/AnswerKey/AnswerKey'
import TriviaRail from 'components/TriviaRail/TriviaRail'
import useNow from 'lib/useNow'
import serverNow from 'lib/serverNow'
import type { TriviaResult, TriviaRound } from 'shared/types'
import styles from './PlayerTrivia.css'

/** Scoreboard rows that fit the stage without shrinking the type. The rest of
 *  the room is still on the board, just below the fold of this screen. */
const SCOREBOARD_ROWS = 6

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
 * The four answers are the only place their text appears — the phones show
 * colour and a numeral and nothing else, which is what makes the room look up.
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

  // Three beats, never two at once: the question, then the answer, then the
  // standings. The scoreboard waits for its own moment because reading which
  // one was right and finding yourself on a list are different jobs.
  const isScoreboard = !!result && serverNow(result, tick) >= result.scoresFrom

  const stateOf = (i: number): AnswerKeyState => {
    if (!result) return 'open'
    return i === result.correctIdx ? 'correct' : 'wrong'
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

        <div className={clsx('silkscreen', styles.attribution)}>
          questions from opentdb.com - CC BY-SA 4.0
        </div>
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

      {/* OpenTDB is CC BY-SA 4.0. The attribution is a licence obligation, so
          it rides on the screen the questions appear on, not only in the docs. */}
      <div className={clsx('silkscreen', styles.attribution)}>
        questions from opentdb.com - CC BY-SA 4.0
      </div>
    </div>
  )
}

export default PlayerTrivia
