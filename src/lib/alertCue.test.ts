import { describe, expect, it, vi } from 'vitest'
import alertCue from './alertCue'

/**
 * The cue's whole job is to fire on phones that each lack a different piece of
 * it, so the case that matters is a device with no Web Audio at all: the
 * vibration still has to happen, and nothing may throw on the way past the
 * missing half.
 */
describe('alertCue', () => {
  it('vibrates without Web Audio, and does not throw', () => {
    const vibrate = vi.fn()
    vi.stubGlobal('navigator', { vibrate })

    expect(() => alertCue()).not.toThrow()
    expect(vibrate).toHaveBeenCalledOnce()

    vi.unstubAllGlobals()
  })

  it('survives a phone with no vibration motor either', () => {
    vi.stubGlobal('navigator', {})

    expect(() => alertCue()).not.toThrow()

    vi.unstubAllGlobals()
  })
})
