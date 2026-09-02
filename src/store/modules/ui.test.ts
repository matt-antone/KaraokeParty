// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { getViewportSize } from 'store/modules/ui'

const setVisualViewport = (value: unknown) => {
  Object.defineProperty(window, 'visualViewport', { value, configurable: true })
}

const setWindowSize = (innerWidth: number, innerHeight: number) => {
  Object.defineProperty(window, 'innerWidth', { value: innerWidth, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: innerHeight, configurable: true })
}

describe('getViewportSize', () => {
  afterEach(() => {
    setVisualViewport(undefined)
  })

  it('falls back to the layout viewport when visualViewport is unavailable', () => {
    setWindowSize(390, 844)
    setVisualViewport(undefined)

    expect(getViewportSize()).toEqual({ innerWidth: 390, innerHeight: 844 })
  })

  it('measures height from visualViewport so an overlaid keyboard shrinks it', () => {
    // iOS leaves window.innerHeight at the full 844 with the keyboard open
    setWindowSize(390, 844)
    setVisualViewport({ height: 508, width: 390 })

    expect(getViewportSize().innerHeight).toBe(508)
  })

  it('rounds the fractional height visualViewport reports', () => {
    setWindowSize(390, 844)
    setVisualViewport({ height: 507.6667, width: 390 })

    expect(getViewportSize().innerHeight).toBe(508)
  })

  it('keeps width on the layout viewport, which pinch-zoom must not move', () => {
    setWindowSize(390, 844)
    setVisualViewport({ height: 844, width: 195 })

    expect(getViewportSize().innerWidth).toBe(390)
  })
})
