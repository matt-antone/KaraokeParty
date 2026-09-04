import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Provider } from 'react-redux'
import { describe, it, expect } from 'vitest'
import TriviaDialog from './TriviaDialog'
import { triviaResult, triviaRound } from 'lib/triviaFixtures'
import type { TriviaResult, TriviaRound } from 'shared/types'

const render = (trivia: { round: TriviaRound, result: TriviaResult }) => renderToStaticMarkup(
  <Provider
    store={{
      getState: () => ({ trivia: { answeredIdx: null as number | null, ...trivia }, user: { userId: 7 } }),
      subscribe: () => () => {},
      dispatch: () => {},
    } as never}
  >
    <TriviaDialog />
  </Provider>,
)

const renderOpen = () => renderToStaticMarkup(
  <Provider
    store={{
      getState: () => ({
        trivia: {
          answeredIdx: null as number | null,
          round: triviaRound({ answers: ['Ludicrous Speed', 'Ridiculous', 'Light', 'Plaid'] }),
          result: null as TriviaResult | null,
        },
        user: { userId: 7 },
      }),
      subscribe: () => () => {},
      dispatch: () => {},
    } as never}
  >
    <TriviaDialog />
  </Provider>,
)

describe('TriviaDialog', () => {
  /**
   * The phone is where the room actually looks during a round, so the beat
   * between questions has to land there too — a screen only the TV shows is
   * one half the party never sees.
   */
  it('counts who got it once the answer has been up', () => {
    const markup = render({ round: triviaRound(), result: triviaResult({ numCorrect: 2 }) })

    expect(markup).toContain('Who got it')
    expect(markup).toContain('>2<')
    expect(markup).toContain('got it')
  })

  it('keeps the standings for the last question', () => {
    const markup = render({ round: triviaRound(), result: triviaResult({ isFinal: true }) })

    expect(markup).toContain('Scores')
    expect(markup).toContain('Dot Matrix')
  })

  /** The question is on the pad; the four answers never are, or the room is
   *  twelve people reading twelve phones. */
  it('carries the question and no answer text while answering is open', () => {
    const markup = renderOpen()

    expect(markup).toContain('Who?')
    expect(markup).not.toContain('Ludicrous Speed')
  })

  it('shows the right answer once answering has closed', () => {
    const markup = render({
      round: triviaRound({ answers: ['Ludicrous Speed', 'Ridiculous', 'Light', 'Plaid'] }),
      result: triviaResult({ correctIdx: 0, scoresFrom: Date.now() + 5000 }),
    })

    expect(markup).toContain('Ludicrous Speed')
    // the answer, and still none of the ones it was up against
    expect(markup).not.toContain('Plaid')
    expect(markup).not.toContain('Dot Matrix')
  })
})
