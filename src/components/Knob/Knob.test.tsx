import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Knob from './Knob'

/**
 * The knob's one piece of real logic: where the index line points. The sweep is
 * 270deg and it must start at -135 and end at +135 — a knob whose ends do not
 * land there reads as broken travel, and there is no number beside it to say
 * otherwise.
 */
const angleOf = (value: number) => {
  const html = renderToStaticMarkup(<Knob value={value} />)
  return html.match(/--knob-angle:\s*(-?[\d.]+)deg/)?.[1]
}

describe('Knob', () => {
  it('sweeps 270deg, -135 to +135', () => {
    expect(angleOf(0)).toBe('-135')
    expect(angleOf(0.5)).toBe('0')
    expect(angleOf(1)).toBe('135')
  })

  it('clamps out-of-range values instead of over-rotating', () => {
    expect(angleOf(-2)).toBe('-135')
    expect(angleOf(4)).toBe('135')
    expect(angleOf(NaN)).toBe('-135')
  })

  it('reports position to assistive tech, since nothing on screen does', () => {
    const html = renderToStaticMarkup(<Knob value={0.78} label='vol' />)
    expect(html).toContain('aria-valuetext="78%"')
    expect(html).toContain('aria-label="vol"')
  })
})
