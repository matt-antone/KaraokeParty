import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect } from 'vitest'
import PlayerTrivia from './PlayerTrivia'
import { triviaResult, triviaRound } from 'lib/triviaFixtures'

const render = (props: Partial<React.ComponentProps<typeof PlayerTrivia>>) =>
  renderToStaticMarkup(<PlayerTrivia round={triviaRound()} width={1280} height={720} {...props} />)

describe('PlayerTrivia', () => {
  /**
   * Between questions the room wants to know who got it, not where the night
   * stands — the standings still have four questions to settle, and the split
   * is the thing people say something about.
   */
  it('splits the room into correct and wrong after a question that is not the last', () => {
    const markup = render({
      result: triviaResult({
        answered: [
          { userId: 42, name: 'Dot Matrix', isCorrect: true },
          { userId: 43, name: 'Barf', isCorrect: false },
        ],
      }),
    })

    expect(markup).toContain('correct 01')
    expect(markup).toContain('wrong 01')
    expect(markup).toContain('Dot Matrix')
    expect(markup).toContain('Barf')
    // the standings are the last question's beat, not this one's
    expect(markup).not.toContain('scores')
  })

  /** Both columns are drawn whatever the split: a round nobody got wrong is an
   *  empty column, not a screen with one column on it. */
  it('keeps both columns when everyone got it', () => {
    const markup = render({
      result: triviaResult({ answered: [{ userId: 42, name: 'Dot Matrix', isCorrect: true }] }),
    })

    expect(markup).toContain('correct 01')
    expect(markup).toContain('wrong 00')
  })

  it('says so when nobody answered', () => {
    expect(render({ result: triviaResult({ answered: [] }) })).toContain('Nobody answered')
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

    expect(render({ result: skewed })).toContain('Dot Matrix')
  })

  it('shows the answer, not the standings, until the scoreboard is due', () => {
    const markup = render({ result: triviaResult({ scoresFrom: Date.now() + 5000 }) })

    expect(markup).not.toContain('Dot Matrix')
    expect(markup).toContain('answer')
  })
})
