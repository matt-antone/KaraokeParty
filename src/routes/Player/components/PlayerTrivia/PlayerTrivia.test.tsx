import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect } from 'vitest'
import PlayerTrivia from './PlayerTrivia'
import { triviaResult, triviaRound } from 'lib/triviaFixtures'

const render = (props: Partial<React.ComponentProps<typeof PlayerTrivia>>) =>
  renderToStaticMarkup(<PlayerTrivia round={triviaRound()} width={1280} height={720} {...props} />)

describe('PlayerTrivia', () => {
  /**
   * Between questions the room wants to know how it did, not where the night
   * stands — the standings still have four questions to settle, and this beat
   * lasts three seconds.
   */
  it('counts who got it after a question that is not the last', () => {
    const markup = render({ result: triviaResult({ numCorrect: 3 }) })

    expect(markup).toContain('got it')
    expect(markup).toContain('>3<')
    // the standings are the last question's beat, not this one's
    expect(markup).not.toContain('scores')
    expect(markup).not.toContain('Dot Matrix')
  })

  /** Zero is a fine answer and gets no special case. */
  it('counts a question nobody got', () => {
    expect(render({ result: triviaResult({ numCorrect: 0 }) })).toContain('>0<')
  })

  /** The last question's board is the round's result, so it keeps the
   *  standings — that is the one everybody is waiting on. */
  it('shows the standings on the final question', () => {
    const markup = render({ result: triviaResult({ isFinal: true }) })

    expect(markup).toContain('scores')
    expect(markup).toContain('Dot Matrix')
  })

  /**
   * The player is whatever box is wired to the TV, and its clock is nobody's
   * responsibility. Read against the server's own stamp, a minute of skew
   * changes nothing; read against Date.now(), a three-second beat vanishes.
   */
  it('reaches the beat on a player whose clock disagrees with the server', () => {
    const skewed = triviaResult({
      // this room's server believes it is a minute later than the player does
      sentAt: Date.now() + 60000,
      scoresFrom: Date.now() + 59000,
      endsAt: Date.now() + 62000,
    })

    expect(render({ result: skewed })).toContain('got it')
  })

  it('shows the answer, not the standings, until the scoreboard is due', () => {
    const markup = render({ result: triviaResult({ scoresFrom: Date.now() + 5000 }) })

    expect(markup).not.toContain('Dot Matrix')
    expect(markup).toContain('answer')
  })
})
