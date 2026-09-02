import { expect, test } from 'vitest'

test('cli flags override env vars and parse numeric levels', async () => {
  process.argv = ['node', 'x', '--data', '/tmp/kp', '-p', '1234', '--scan', 'all',
    '--serverLogLevel', '5', '--rotateKey']

  const { default: env } = await import('./cli.js')

  expect(env.KES_PATH_DATA).toBe('/tmp/kp')
  expect(env.KES_PORT).toBe(1234)
  expect(env.KES_SCAN).toBe('all')
  expect(env.KES_SERVER_LOG_LEVEL).toBe(5)
  expect(env.KES_ROTATE_KEY).toBe(true)
})
