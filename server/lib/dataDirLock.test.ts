import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import claimDataDir from './dataDirLock.js'

const dirs: string[] = []

const dataDir = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kp-lock-'))
  dirs.push(dir)
  return dir
}

const lockOf = (dir: string) => path.join(dir, 'server.pid')

afterEach(() => {
  while (dirs.length) fs.rmSync(dirs.pop()!, { recursive: true, force: true })
})

describe('claimDataDir', () => {
  it('claims a free directory and releases it', async () => {
    const dir = dataDir()

    const release = await claimDataDir(dir)
    expect(fs.readFileSync(lockOf(dir), 'utf8')).toBe(String(process.pid))

    release()
    expect(fs.existsSync(lockOf(dir))).toBe(false)
  })

  /**
   * The one that matters: this is the failure that spent a night looking like
   * a broken trivia round. A second server must not start on a directory a
   * live one is already using.
   */
  it('refuses a directory a running server holds', async () => {
    const dir = dataDir()
    // this test process is, definitively, running
    fs.writeFileSync(lockOf(dir), String(process.pid))

    await expect(claimDataDir(dir)).rejects.toThrow(/already using/)
  }, 10000)

  it('takes over a lock left behind by a crash', async () => {
    const dir = dataDir()
    // a pid that cannot be running: allocation starts at 1 and this is beyond
    // any pid_max, so the file can only be a leftover
    fs.writeFileSync(lockOf(dir), '4294967295')

    const release = await claimDataDir(dir)
    expect(fs.readFileSync(lockOf(dir), 'utf8')).toBe(String(process.pid))

    release()
  })

  it('ignores a lock file that is not a pid at all', async () => {
    const dir = dataDir()
    fs.writeFileSync(lockOf(dir), 'not a pid\n')

    const release = await claimDataDir(dir)
    expect(fs.readFileSync(lockOf(dir), 'utf8')).toBe(String(process.pid))

    release()
  })
})
