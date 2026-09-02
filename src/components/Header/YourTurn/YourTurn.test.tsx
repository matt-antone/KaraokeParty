// @vitest-environment happy-dom
import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import YourTurn, { type YourTurnProps } from './YourTurn'

/**
 * The only status surface in the product, and the answer to the one question a
 * singer opens their phone to ask. Four states, each with its own headline,
 * label and meter level — none of which anything else asserts.
 */

// vitest globals are off, so RTL's own afterEach hook never registers
afterEach(cleanup)

const read = (props: YourTurnProps) => {
  const { container } = render(<YourTurn {...props} />)
  const meter = screen.getByRole('meter')

  return {
    headline: container.querySelector('.wait')?.textContent,
    label: container.querySelector('.label')?.textContent,
    level: Number(meter.getAttribute('aria-valuenow')),
    // the pause key is icon-only, so its name is the accessible one
    button: screen.getByRole('button').getAttribute('aria-label'),
    // every state is a tinted well; the class names which tint
    standby: container.firstElementChild?.classList.contains('standby'),
    onStage: container.firstElementChild?.classList.contains('onStage'),
  }
}

describe('YourTurn', () => {
  it('up now: pegs the meter and says so', () => {
    expect(read({ isUpNow: true, wait: '4 min', position: 1, rotationSize: 6 })).toMatchObject({
      headline: 'Now',
      label: 'you are on stage',
      level: 1,
    })
  })

  it('up next: shows the wait, the place, and a meter well up the scale', () => {
    expect(read({ wait: '4 min', position: 3, rotationSize: 4 })).toMatchObject({
      headline: '4 min',
      label: '3 of 4 in the rotation',
      // 1 - (3-1)/4
      level: 0.5,
    })
  })

  it('deep in the rotation: the meter floors instead of emptying', () => {
    // last of twenty is 0.05 raw, which reads as paused; the floor keeps a
    // single segment lit so the meter still reads as "in the rotation"
    expect(read({ wait: '48 min', position: 20, rotationSize: 20 })).toMatchObject({
      headline: '48 min',
      label: '20 of 20 in the rotation',
      level: 0.06,
    })
  })

  it('paused: empties the meter completely and offers the way back', () => {
    expect(read({ isPaused: true, wait: '4 min', position: 2, rotationSize: 6 })).toMatchObject({
      headline: 'Paused',
      label: 'you are out of the rotation',
      level: 0,
      button: 'Resume my songs',
    })
  })

  it('paused beats up-now: a paused singer is not on stage', () => {
    expect(read({ isPaused: true, isUpNow: true })).toMatchObject({
      headline: 'Paused',
      level: 0,
    })
  })

  it('nothing queued: no wait to show, and a half-scale idle meter', () => {
    expect(read({})).toMatchObject({
      headline: '--',
      label: 'nothing queued',
      level: 0.5,
      button: 'Pause my songs',
    })
  })

  it('counts songs in words a human uses', () => {
    const count = (songCount: number) => {
      const { container } = render(<YourTurn songCount={songCount} />)
      const text = container.querySelector('.songCount')?.textContent
      cleanup()
      return text
    }

    expect(count(1)).toBe('1 song')
    expect(count(0)).toBe('0 songs')
    expect(count(4)).toBe('4 songs')
  })

  // "armed but not running" is the same state the library gives a queued song,
  // and it says it in --standby. Amber is reserved for the live channel.
  it('waits in standby teal', () => {
    expect(read({ wait: '8 min', position: 2, rotationSize: 6 }).standby).toBe(true)
  })

  it('drops standby once on stage', () => {
    expect(read({ isUpNow: true, position: 1, rotationSize: 6 }).standby).toBe(false)
  })

  it('drops standby when paused', () => {
    expect(read({ isPaused: true, position: 2, rotationSize: 6 }).standby).toBe(false)
  })

  it('wears the live amber well on stage', () => {
    expect(read({ isUpNow: true, position: 1, rotationSize: 6 }).onStage).toBe(true)
  })

  it('is not on stage while paused, even when up', () => {
    // paused wins: a dead channel must not read as the live one
    expect(read({ isUpNow: true, isPaused: true }).onStage).toBe(false)
  })

  it('names the next song rather than a place in the rotation', () => {
    // a singer wants to know what they are waiting for, not their index
    expect(read({ wait: '8 min', position: 2, rotationSize: 6, nextSong: 'Bohemian Rhapsody' }))
      .toMatchObject({ label: 'Bohemian Rhapsody' })
  })

  it('falls back to the rotation when the title is not loaded yet', () => {
    expect(read({ wait: '8 min', position: 2, rotationSize: 6 }))
      .toMatchObject({ label: '2 of 6 in the rotation' })
  })

  it('still says on stage over any next song', () => {
    expect(read({ isUpNow: true, nextSong: 'Dancing Queen' }).label).toBe('you are on stage')
  })

  it('still says paused over any next song', () => {
    expect(read({ isPaused: true, nextSong: 'Dancing Queen' }).label).toBe('you are out of the rotation')
  })
})
