import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect } from 'vitest'
import PlayerTrivia from './PlayerTrivia'
import { triviaResult, triviaRound } from 'lib/triviaFixtures'

const render = (props: Partial<React.ComponentProps<typeof PlayerTrivia>>) =>
  renderToStaticMarkup(<PlayerTrivia round={triviaRound()} width={1280} height={720} {...props} />)

describe('PlayerTrivia', () => {
  /**
   * The standings are not the final question's private payoff: they go up
   * after every answer, or there is nothing to chase for four questions.
   */
  it('shows the standings after a question that is not the last', () => {
    const markup = render({ result: triviaResult() })

    expect(markup).toContain('Dot Matrix')
    expect(markup).toContain('scores')
  })

  /**
   * The player is whatever box is wired to the TV, and its clock is nobody's
   * responsibility. Read against the server's own stamp, a minute of skew
   * changes nothing; read against Date.now(), a three-second beat vanishes.
   */
  it('shows the standings on a player whose clock disagrees with the server', () => {
    const skewed = triviaResult({
      // this room's server believes it is a minute later than the player does
      sentAt: Date.now() + 60000,
      scoresFrom: Date.now() + 59000,
      endsAt: Date.now() + 62000,
    })

    expect(render({ result: skewed })).toContain('Dot Matrix')
  })

  it('shows the answer, not the standings, until the scoreboard is due', () => {
    const markup = render({ result: triviaResult({ scoresFrom: Date.now() + 5000 }) })

    expect(markup).not.toContain('Dot Matrix')
    expect(markup).toContain('answer')
  })
})
