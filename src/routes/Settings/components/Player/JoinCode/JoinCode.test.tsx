// @vitest-environment happy-dom
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import JoinCode from './JoinCode'

afterEach(cleanup)

// react-qrcode-logo renders to a canvas, so the encoded value isn't readable
// from the DOM. Swap it for a stub that puts the value in a data attribute.
vi.mock('react-qrcode-logo', () => ({
  QRCode: (props: { value: string }) => <div data-testid='qr' data-value={props.value} />,
}))

// Modal renders into a native <dialog>; skip its showModal() plumbing and
// just render what's passed to it.
vi.mock('components/Modal/Modal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('JoinCode join URL', () => {
  it('encodes the server\'s LAN address and roomId, not the browser\'s own', () => {
    render(<JoinCode roomId={7} serverUrl='http://192.168.86.235:3739/' onClose={() => {}} />)

    const value = screen.getByTestId('qr').getAttribute('data-value')
    expect(value).toMatch(/^http:\/\/192\.168\.86\.235:3739\//)
    expect(value).toContain('roomId=7')
    expect(value?.startsWith(window.location.origin)).toBe(false)
    expect(screen.getByText(value!)).toBeTruthy()
  })

  it('appends the base64 room password when one is set', () => {
    render(
      <JoinCode roomId={7} serverUrl='http://192.168.86.235:3739/' qrPassword='hunter2' onClose={() => {}} />,
    )

    const value = screen.getByTestId('qr').getAttribute('data-value')
    expect(value).toContain(`password=${encodeURIComponent(btoa('hunter2'))}`)
  })

  it('says so instead of falling back to a localhost URL when the server reports none', () => {
    render(<JoinCode roomId={7} serverUrl={undefined} onClose={() => {}} />)

    expect(screen.queryByTestId('qr')).toBeNull()
    expect(screen.getByText(/hasn.t reported a LAN address/)).toBeTruthy()
  })
})
