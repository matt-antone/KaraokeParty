import React, { useState } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import AnswerKey, { type AnswerKeyState } from 'components/AnswerKey/AnswerKey'
import Modal from 'components/Modal/Modal'
import useTriviaStage from 'lib/useTriviaStage'
import { answerTrivia } from 'store/modules/trivia'
import styles from './TriviaDialog.css'

/**
 * The answer pad, on a phone.
 *
 * It carries no answer text on purpose — four colours and four numerals and
 * nothing else. The question and its answers are on the player screen, so the
 * room looks up at the TV together rather than down at twelve phones, and
 * whoever is at the microphone is not competing with a wall of reading.
 */
const TriviaDialog = () => {
  const dispatch = useAppDispatch()
  const { round, result } = useTriviaStage()
  const answeredIdx = useAppSelector(state => state.trivia.answeredIdx)
  const [dismissedRoundId, setDismissedRoundId] = useState<number | null>(null)

  if (!round || dismissedRoundId === round.roundId) return null

  const stateOf = (i: number): AnswerKeyState => {
    if (result) return i === result.correctIdx ? 'correct' : 'wrong'
    return i === answeredIdx ? 'chosen' : 'open'
  }

  return (
    <Modal
      className={styles.modal}
      title={result ? 'Answer' : 'Trivia'}
      onClose={() => setDismissedRoundId(round.roundId)}
    >
      <div className={styles.keys}>
        {round.answers.map((answer, i) => (
          <AnswerKey
            key={answer}
            index={i}
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
          : answeredIdx !== null ? 'Locked in' : 'Match your answer on the screen'}
      </div>
    </Modal>
  )
}

export default TriviaDialog
