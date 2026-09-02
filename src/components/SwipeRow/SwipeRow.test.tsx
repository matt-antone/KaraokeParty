// @vitest-environment happy-dom
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import SwipeRow from './SwipeRow'
import { CAPTURE_PX, SNAP_AT, SWIPE_ACTION_WIDTH, type SwipeAction } from './constants'

/**
 * The product's only row-action pattern. Everything here is pointer arithmetic
 * that no other test reaches: how far the row travels, when it snaps, and —
 * the one most likely to regress — when it refuses the gesture so the list
 * underneath can still scroll.
 */

// vitest globals are off, so RTL's own afterEach hook never registers
afterEach(cleanup)

const action = (label: string, onClick?: () => void): SwipeAction =>
  ({ icon: 'DELETE', label, onClick })

const renderRow = (actions: SwipeAction[], props = {}) => {
  const onOpenChange = vi.fn()
  const { container, rerender } = render(
    <SwipeRow actions={actions} onOpenChange={onOpenChange} {...props}>
      <div>row content</div>
    </SwipeRow>,
  )

  const slider = container.querySelector('.slider') as HTMLElement

  return { onOpenChange, slider, container, rerender }
}

/** px the slider is currently translated by, negative = open. */
const offsetOf = (slider: HTMLElement) =>
  parseFloat(slider.style.transform.match(/translateX\((-?[\d.]+)px\)/)?.[1] ?? 'NaN')

/** One pointer gesture: down, a move to each delta, then up. */
const drag = (slider: HTMLElement, ...deltas: Array<[number, number]>) => {
  fireEvent.pointerDown(slider, { clientX: 100, clientY: 100, pointerId: 1 })
  for (const [dx, dy] of deltas) {
    fireEvent.pointerMove(slider, { clientX: 100 + dx, clientY: 100 + dy, pointerId: 1 })
  }
}

describe('SwipeRow gesture', () => {
  it('snaps open past SNAP_AT of its travel', () => {
    const { onOpenChange, slider } = renderRow([action('Remove')])
    const span = SWIPE_ACTION_WIDTH

    drag(slider, [-(span * SNAP_AT) - 5, 0])
    fireEvent.pointerUp(slider)

    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it('snaps back short of SNAP_AT', () => {
    const { onOpenChange, slider } = renderRow([action('Remove')])
    const span = SWIPE_ACTION_WIDTH

    // far enough to capture the gesture, not far enough to keep it open
    drag(slider, [-(span * SNAP_AT) + 5, 0])
    expect(offsetOf(slider)).toBeLessThan(0)

    fireEvent.pointerUp(slider)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('caps travel at one action width per action', () => {
    const { slider } = renderRow([action('Top'), action('Remove')])

    drag(slider, [-1000, 0])

    expect(offsetOf(slider)).toBe(-2 * SWIPE_ACTION_WIDTH)
  })

  it('does not travel the wrong way', () => {
    const { slider } = renderRow([action('Remove')])

    drag(slider, [500, 0])

    expect(offsetOf(slider)).toBe(0)
  })

  it('hands a vertical gesture back to the list', () => {
    const { onOpenChange, slider } = renderRow([action('Remove')])

    // a real thumb scrolling the page never moves in a perfectly straight line
    drag(slider, [-6, -40], [-80, -120])

    expect(offsetOf(slider)).toBe(0)
    fireEvent.pointerUp(slider)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('does not capture movement under CAPTURE_PX', () => {
    const { onOpenChange, slider } = renderRow([action('Remove')])

    drag(slider, [-(CAPTURE_PX - 1), 0])

    expect(offsetOf(slider)).toBe(0)
    fireEvent.pointerUp(slider)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('gives a row with no actions no travel at all', () => {
    const { onOpenChange, slider, container } = renderRow([])

    drag(slider, [-1000, 0])
    fireEvent.pointerUp(slider)

    expect(offsetOf(slider)).toBe(0)
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(container.querySelector('.actions')).toBeNull()
  })

  it('rests aside by exactly its span while open', () => {
    const { slider } = renderRow([action('Top'), action('Remove')], { isOpen: true })

    expect(offsetOf(slider)).toBe(-2 * SWIPE_ACTION_WIDTH)
  })
})

describe('SwipeRow actions', () => {
  it('keeps action keys out of the tab order until the row is open', () => {
    const { rerender } = renderRow([action('Top'), action('Remove')])

    for (const label of ['Top', 'Remove']) {
      expect(screen.getByLabelText(label)).toHaveProperty('tabIndex', -1)
    }

    rerender(
      <SwipeRow actions={[action('Top'), action('Remove')]} isOpen>
        <div>row content</div>
      </SwipeRow>,
    )

    for (const label of ['Top', 'Remove']) {
      expect(screen.getByLabelText(label)).toHaveProperty('tabIndex', 0)
    }
  })

  it('closes the row and fires the handler when an action is pressed', () => {
    const onClick = vi.fn()
    const { onOpenChange } = renderRow([action('Remove', onClick)], { isOpen: true })

    fireEvent.click(screen.getByLabelText('Remove'))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onClick).toHaveBeenCalled()
  })
})
