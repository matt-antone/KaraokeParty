import React, { useEffect, useState } from 'react'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import AnswerKey, { type AnswerKeyState } from 'components/AnswerKey/AnswerKey'
import Modal from 'components/Modal/Modal'
import TriviaRail from 'components/TriviaRail/TriviaRail'
import TriviaTally from 'components/TriviaTally/TriviaTally'
import alertCue from 'lib/alertCue'
import serverNow from 'lib/serverNow'
import useNow from 'lib/useNow'
import useTriviaStage from 'lib/useTriviaStage'
import { answerTrivia } from 'store/modules/trivia'
import styles from './TriviaDialog.css'

/**
 * The answer pad, on a phone.
 *
 * It carries the whole round: the question, the four answers, and the clock.
 * Nobody has to look up at the TV to play — which matters most for the guest
 * at the microphone, the one in the next room, and anyone who cannot read a
 * screen across a bar. The TV is where the round happens together; the pad is
 * where it stays playable.
 *
 * The keys say what they are rather than which they are. A numeral bridging
 * the pad to the screen bridges nothing once both spell out "Saturn", and the
 * reveal lights the key with the answer written on it.
 *
 * The clock is the same two marks the TV uses: how far through the round you
 * are, and how much of the answering time is left.
 */
/** What fits a phone without scrolling. Everyone else is still on the board;
 *  the TV carries the same list. */
const SCOREBOARD_ROWS = 5

const TriviaDialog = () => {
  const dispatch = useAppDispatch()
  const { round, result } = useTriviaStage()
  const answeredIdx = useAppSelector(state => state.trivia.answeredIdx)
  const userId = useAppSelector(state => state.user.userId)
  const tick = useNow()
  const [dismissedRoundId, setDismissedRoundId] = useState<number | null>(null)

  const isOpen = !!round && dismissedRoundId !== round.roundId

  // the pad arriving is the only notice a guest gets, and it arrives on a
  // phone that is face down as often as not
  useEffect(() => {
    if (isOpen) alertCue()
  }, [isOpen])

  if (!round || !isOpen) return null

  // The beat after the answer takes the pad's place rather than sitting under
  // it: the keys are dead during the reveal anyway, and a phone has room for
  // one thing. The pad runs the player's beats, off the player's stamps.
  const now = result ? serverNow(result, tick) : 0
  const isTally = !!result && now >= result.scoresFrom
  const isScoreboard = !!result?.boardFrom && now >= result.boardFrom

  const stateOf = (i: number): AnswerKeyState => {
    if (result) {
      if (i === result.correctIdx) return 'correct'
      return i === answeredIdx ? 'missed' : 'wrong'
    }

    if (answeredIdx === null) return 'open'
    return i === answeredIdx ? 'chosen' : 'closed'
  }

  // The same count the TV shows, on every question including the last.
  if (isTally && !isScoreboard) {
    return (
      <Modal
        className={styles.modal}
        title='Who got it'
        onClose={() => setDismissedRoundId(round.roundId)}
      >
        <TriviaTally numCorrect={result.numCorrect} variant='pad' />
      </Modal>
    )
  }

  if (isScoreboard) {
    // Top five, and your own row after them if you are not in it. A board you
    // cannot find yourself on is a board you stop playing for, and outside the
    // top five is exactly where most of the room is standing.
    const myRank = result.scores.findIndex(s => s.userId === userId)
    const rows = result.scores.slice(0, SCOREBOARD_ROWS).map((score, i) => ({ score, rank: i, isAside: false }))

    if (myRank >= SCOREBOARD_ROWS) {
      rows.push({ score: result.scores[myRank], rank: myRank, isAside: true })
    }

    return (
      <Modal
        className={styles.modal}
        title='Scores'
        onClose={() => setDismissedRoundId(round.roundId)}
      >
        {rows.length > 0
          ? (
              <div className={styles.scoreboard}>
                {rows.map(({ score: s, rank, isAside }) => (
                  <div
                    key={s.userId}
                    className={clsx(
                      styles.scoreRow,
                      s.userId === userId && styles.mine,
                      isAside && styles.aside,
                    )}
                  >
                    <span className={styles.rank}>{String(rank + 1).padStart(2, '0')}</span>
                    <span className={styles.scoreName} translate='no'>{s.name}</span>
                    <span className={styles.score}>{s.score}</span>
                  </div>
                ))}
              </div>
            )
          : <div className={styles.hint}>Nobody played</div>}
      </Modal>
    )
  }

  return (
    <Modal
      className={styles.modal}
      title={result ? 'Answer' : 'Trivia'}
      onClose={() => setDismissedRoundId(round.roundId)}
    >
      {/* The same two marks the TV carries, so the pad and the room run one
          clock — and no answer text, so the question stays on the screen. */}
      <TriviaRail round={round} isRunning={!result} variant='pad' />

      <div className={styles.question} translate='no'>{round.question}</div>

      <div className={styles.keys}>
        {round.answers.map((answer, i) => (
          <AnswerKey
            key={answer}
            index={i}
            label={answer}
            variant='pad'
            state={stateOf(i)}
            // one answer each, and the reveal is not a chance to change it
            disabled={answeredIdx !== null || !!result}
            onClick={() => dispatch(answerTrivia(round.roundId, i))}
          />
        ))}
      </div>
      <div className={styles.hint}>
        {result
          ? 'The lit key was the answer'
          : answeredIdx !== null ? 'Locked in' : 'Tap your answer'}
      </div>
    </Modal>
  )
}

export default TriviaDialog
