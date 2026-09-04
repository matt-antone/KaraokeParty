import { describe, expect, it, vi } from 'vitest'
import mountDevLogin, { isDevLoginEnabled, isLoopback } from './devLogin.js'

vi.mock('../lib/Database.js', () => ({ db: { get: vi.fn() } }))

const fakeRouter = () => {
  const post = vi.fn()
  const get = vi.fn()
  return { router: { post, get }, post, get }
}

describe('isDevLoginEnabled', () => {
  it('needs both development and the opt-in flag', () => {
    expect(isDevLoginEnabled({ NODE_ENV: 'development', KES_DEV_LOGIN: '1' })).toBe(true)
  })

  // the door must not be open just because someone ran the dev server
  it('stays off in development without the flag', () => {
    expect(isDevLoginEnabled({ NODE_ENV: 'development' })).toBe(false)
  })

  // and setting the flag on a built server must not open it either
  it('stays off in production even with the flag', () => {
    expect(isDevLoginEnabled({ NODE_ENV: 'production', KES_DEV_LOGIN: '1' })).toBe(false)
  })

  it('stays off when NODE_ENV is unset', () => {
    expect(isDevLoginEnabled({ KES_DEV_LOGIN: '1' })).toBe(false)
  })
})

describe('isLoopback', () => {
  it('accepts loopback in the shapes it actually arrives in', () => {
    for (const ip of ['127.0.0.1', '::1', '::ffff:127.0.0.1']) {
      expect(isLoopback(ip)).toBe(true)
    }
  })

  // a dev server binds the LAN, so every phone on the wifi reaches it
  it('refuses anything off-machine', () => {
    for (const ip of ['192.168.86.235', '10.0.0.4', '::ffff:192.168.86.235', undefined]) {
      expect(isLoopback(ip)).toBe(false)
    }
  })
})

describe('mountDevLogin', () => {
  it('does not register the route when the gates are shut', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('KES_DEV_LOGIN', '')
    const { router, post, get } = fakeRouter()

    expect(mountDevLogin(router, vi.fn())).toBe(false)
    expect(post).not.toHaveBeenCalled()
    expect(get).not.toHaveBeenCalled()
    vi.unstubAllEnvs()
  })

  it('registers the route when they are open', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('KES_DEV_LOGIN', '1')
    const { router, post, get } = fakeRouter()

    expect(mountDevLogin(router, vi.fn())).toBe(true)
    expect(post).toHaveBeenCalledWith('/dev-login', expect.any(Function))
    expect(get).toHaveBeenCalledWith('/dev-login', expect.any(Function))
    vi.unstubAllEnvs()
  })
})
