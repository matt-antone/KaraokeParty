import { expect, test, vi } from 'vitest'
import { requireAdmin } from './util.js'

const throws = (status: number) => {
  throw new Error(String(status))
}

test('requireAdmin passes admins through and 401s everyone else', () => {
  const next = vi.fn()

  requireAdmin({ user: { isAdmin: true }, throw: throws }, next)
  expect(next).toHaveBeenCalled()

  expect(() => requireAdmin({ user: { isAdmin: false }, throw: throws }, next)).toThrow('401')
  expect(next).toHaveBeenCalledTimes(1)
})
