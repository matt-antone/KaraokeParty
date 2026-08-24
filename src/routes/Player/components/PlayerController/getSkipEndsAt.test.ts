import { describe, it, expect } from 'vitest'
import getSkipEndsAt from './getSkipEndsAt'
import type { PlayerState } from '../../modules/player'

const player = (props: Partial<PlayerState>) => ({
  _isPlayingNext: false,
  _lastSkipTime: 1000,
  ...props,
} as PlayerState)

describe('getSkipEndsAt', () => {
  it('is null when nothing was skipped', () => {
    expect(getSkipEndsAt(player({}), true, false)).toBeNull()
  })

  it('holds for an intermission after a skip', () => {
    expect(getSkipEndsAt(player({ _isPlayingNext: true }), true, false)).toBeGreaterThan(1000)
  })

  it('is null at the end of the queue', () => {
    expect(getSkipEndsAt(player({ _isPlayingNext: true }), false, false)).toBeNull()
  })

  it('is null when an intermission is already running', () => {
    expect(getSkipEndsAt(player({ _isPlayingNext: true }), true, true)).toBeNull()
  })
})
