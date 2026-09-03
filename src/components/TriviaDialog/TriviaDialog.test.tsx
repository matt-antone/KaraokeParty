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

describe('TriviaDialog', () => {
  /**
   * The phone is where the room actually looks during a round, so the
   * standings have to land there too — a scoreboard only the TV shows is a
   * scoreboard half the party never sees.
   */
  it('shows the standings on the phone once the scoreboard is due', () => {
    const markup = render({ round: triviaRound(), result: triviaResult() })

    expect(markup).toContain('Scores')
    expect(markup).toContain('Dot Matrix')
  })

  it('shows the answer pad until then', () => {
    const markup = render({ round: triviaRound(), result: triviaResult({ scoresFrom: Date.now() + 5000 }) })

    expect(markup).toContain('Answer')
    expect(markup).not.toContain('Dot Matrix')
  })
})
