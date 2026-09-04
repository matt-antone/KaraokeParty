// @vitest-environment happy-dom
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import PlayerTrivia from './PlayerTrivia'
import { triviaResult, triviaRound } from 'lib/triviaFixtures'

/**
 * The count lands with a noise on the TV. What is worth pinning is not which
 * file plays but that it plays *once*: the tally is on screen for three
 * seconds and the component re-renders on every tick of the clock behind it.
 */
const played: string[] = []

class FakeAudio {
  constructor (src: string) { played.push(src) }
  play () { return Promise.resolve() }
}

vi.stubGlobal('Audio', FakeAudio)

const stage = (numCorrect: number, boardFrom: number | null = null) => (
  <PlayerTrivia
    round={triviaRound()}
    result={triviaResult({ numCorrect, isFinal: boardFrom !== null, boardFrom })}
    width={1280}
    height={720}
  />
)

afterEach(() => {
  cleanup()
  played.length = 0
})

describe('the tally cue', () => {
  it('cheers when the room got it', () => {
    render(stage(3))
    expect(played).toEqual(['assets/audience-applause.mp3'])
  })

  it('groans when nobody did', () => {
    render(stage(0))
    expect(played).toEqual(['assets/losing-horns-1.mp3'])
  })

  it('plays once, however many times the clock ticks', () => {
    const { rerender } = render(stage(3))

    for (let i = 0; i < 3; i++) rerender(stage(3))

    expect(played).toHaveLength(1)
  })

  it('cheers the last question too — its count is a beat like any other', () => {
    render(stage(3, Date.now() + 2000))
    expect(played).toEqual(['assets/audience-applause.mp3'])
  })

  /** A player that reloads onto the standings should not applaud a beat that
   *  has already been and gone. */
  it('stays quiet once the standings have taken over', () => {
    render(stage(3, Date.now() - 500))
    expect(played).toEqual([])
  })
})
