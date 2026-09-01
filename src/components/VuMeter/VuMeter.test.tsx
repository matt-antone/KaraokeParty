import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import VuMeter from './VuMeter'
import { clampValue, segmentState } from './segments'

/**
 * The meter's one piece of real logic: how many segments light, and what each
 * lit one reads as. Tested as a pure function rather than through the DOM —
 * the colours live in a CSS module, which resolves to nothing under vitest.
 */

/** State of every segment on a 20-segment scale, as a compact string. */
const scale = (value: number, peakFrom = 0.86, segments = 20) =>
  Array.from({ length: segments }, (_, i) =>
    segmentState(i, segments, value, peakFrom)[0]).join('')

describe('segmentState', () => {
  it('lights segments in proportion to value', () => {
    expect(scale(0.5).replace(/o/g, '')).toHaveLength(10)
    expect(scale(0.25).replace(/o/g, '')).toHaveLength(5)
  })

  it('is fully dark at 0 and fully lit at 1', () => {
    expect(scale(0)).toBe('o'.repeat(20))
    expect(scale(1)).not.toContain('o')
  })

  it('steps dim -> hot up the scale, so the strip reads as calibrated', () => {
    // HOT_FROM is 0.55, so segments 0-10 are dim and 11+ are hot
    expect(scale(1, 2)).toBe('d'.repeat(11) + 'h'.repeat(9))
  })

  it('reddens only the top of the scale, and only past peakFrom', () => {
    // peakFrom 0.8 => the segments at 0.80, 0.85, 0.90, 0.95
    expect(scale(1, 0.8).split('').filter(c => c === 'p')).toHaveLength(4)
  })

  it('never reddens when peaking is switched off', () => {
    // every non-audio meter passes peakFrom above 1: a scan at 90% is not a fault
    expect(scale(1, 2)).not.toContain('p')
  })

  it('colours by position, not by value: a segment does not change as it fills', () => {
    // segment 15 reads the same whether the meter is half lit or fully lit
    expect(segmentState(15, 20, 0.8, 2)).toBe(segmentState(15, 20, 1, 2))
  })
})

describe('clampValue', () => {
  it('clamps live values instead of overflowing the meter', () => {
    // these arrive from scan pct, play position and audio level
    expect(clampValue(1.4)).toBe(1)
    expect(clampValue(-0.3)).toBe(0)
    expect(clampValue(NaN)).toBe(0)
    expect(clampValue(0.42)).toBe(0.42)
  })

  it('never lights more segments than exist', () => {
    expect(scale(99)).not.toContain('o')
    expect(scale(-99)).toBe('o'.repeat(20))
  })
})

describe('VuMeter', () => {
  it('exposes the clamped reading to assistive tech', () => {
    const html = renderToStaticMarkup(<VuMeter value={0.42} label='Scan progress' />)
    expect(html).toContain('role="meter"')
    expect(html).toContain('aria-valuenow="0.42"')
    expect(html).toContain('aria-label="Scan progress"')

    expect(renderToStaticMarkup(<VuMeter value={3} />)).toContain('aria-valuenow="1"')
  })

  it('renders one element per segment', () => {
    const html = renderToStaticMarkup(<VuMeter value={0.5} segments={24} />)
    expect(html.match(/<i/g)).toHaveLength(24)
  })
})
