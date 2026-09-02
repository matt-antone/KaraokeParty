import { expect, test, vi } from 'vitest'
import { requireAdmin } from './util.js'

const ctx = (isAdmin: boolean) => ({
  user: { isAdmin },
  throw: (status: number) => { throw new Error(String(status)) },
})

test('requireAdmin passes admins through and 401s everyone else', () => {
  const next = vi.fn()

  requireAdmin(ctx(true), next)
  expect(next).toHaveBeenCalled()

  expect(() => requireAdmin(ctx(false), next)).toThrow('401')
  expect(next).toHaveBeenCalledTimes(1)
})
