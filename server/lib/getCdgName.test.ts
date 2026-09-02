import { expect, test } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import getCdgName from './getCdgName.js'

test('finds the sidecar .cdg whatever its case, else null', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdg-'))
  fs.writeFileSync(path.join(dir, 'Song.CDG'), '')
  fs.writeFileSync(path.join(dir, 'Other.mp3'), '')

  expect(getCdgName(path.join(dir, 'Song.mp3'))).toBe(path.join(dir, 'Song.CDG'))
  expect(getCdgName(path.join(dir, 'Other.mp3'))).toBe(null)
  expect(getCdgName(path.join(dir, 'nope', 'x.mp3'))).toBe(null)
})
