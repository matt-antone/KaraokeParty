// @vitest-environment happy-dom
import React from 'react'
import type { DynamicRowHeight } from 'react-window'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import PaddedList from './PaddedList'

/**
 * The measurement cache PaddedList hands react-window. Real measurement is a
 * ResizeObserver reporting layout, and there is no layout here — so this tests
 * the cache's contract instead: estimate until measured, measured thereafter,
 * and forgotten when index -> content changes.
 *
 * react-window is stubbed out because the cache is a closure inside PaddedList
 * with no other way out.
 */

let rowHeightProp: DynamicRowHeight

vi.mock('react-window', () => ({
  List: (props: { rowHeight: DynamicRowHeight }): null => {
    rowHeightProp = props.rowHeight
    return null
  },
}))

// vitest globals are off, so RTL's own afterEach hook never registers
afterEach(cleanup)

const PADDING_TOP = 10
const PADDING_BOTTOM = 20
const NUM_ROWS = 3
const ESTIMATE = 50

/** must be stable, or the cache is rebuilt every render */
const estimate = (): number => ESTIMATE
const Row = (): null => null

/** index in list coordinates: 0 is the top spacer, so row n is n + 1 */
const row = (n: number) => n + 1

describe('PaddedList measurement cache', () => {
  let rerender: (ui: React.ReactElement) => void

  const list = (cacheKey: string) => (
    <PaddedList
      cacheKey={cacheKey}
      numRows={NUM_ROWS}
      paddingTop={PADDING_TOP}
      paddingBottom={PADDING_BOTTOM}
      height={400}
      rowComponent={Row}
      rowHeight={estimate}
    />
  )

  beforeEach(() => {
    ({ rerender } = render(list('a')))
  })

  it('falls back to the estimate for a row nothing has measured', () => {
    expect(rowHeightProp.getRowHeight(row(0))).toBe(ESTIMATE)
    expect(rowHeightProp.getRowHeight(row(2))).toBe(ESTIMATE)
  })

  it('estimates the spacers as the padding they stand in for', () => {
    expect(rowHeightProp.getRowHeight(0)).toBe(PADDING_TOP)
    expect(rowHeightProp.getRowHeight(NUM_ROWS + 1)).toBe(PADDING_BOTTOM)
  })

  it('returns the measured height once a row has been measured', () => {
    act(() => rowHeightProp.setRowHeight(row(1), 88))

    expect(rowHeightProp.getRowHeight(row(1))).toBe(88)
    // and only that row
    expect(rowHeightProp.getRowHeight(row(0))).toBe(ESTIMATE)
  })

  it('ignores a re-measurement at the same height', () => {
    act(() => rowHeightProp.setRowHeight(row(1), 88))
    const settled = rowHeightProp

    act(() => rowHeightProp.setRowHeight(row(1), 88))

    // an unchanged measurement must not produce a new cache: react-window
    // re-renders on identity, and re-rendering is what triggers measurement
    expect(rowHeightProp).toBe(settled)
  })

  it('forgets every measurement when cacheKey changes', () => {
    act(() => rowHeightProp.setRowHeight(row(1), 88))
    expect(rowHeightProp.getRowHeight(row(1))).toBe(88)

    // index -> content has changed (a new search), so 88 belongs to some other song
    rerender(list('b'))

    expect(rowHeightProp.getRowHeight(row(1))).toBe(ESTIMATE)
  })

  it('keeps measurements when cacheKey has not changed', () => {
    act(() => rowHeightProp.setRowHeight(row(1), 88))

    rerender(list('a'))

    expect(rowHeightProp.getRowHeight(row(1))).toBe(88)
  })
})
