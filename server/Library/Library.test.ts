import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { open, close } from '../lib/Database.js'
import Library from './Library.js'

// covers the filename-taxonomy round trip: parser output -> songs.tags -> client payload
describe('Library tags', () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ke-test-')), 'test.sqlite3')
  let db

  beforeAll(() => {
    db = open({ file, ro: false })
    db.run('INSERT INTO paths (pathId, path, priority) VALUES (1, \'/media\', 1)')
  })

  afterAll(() => {
    close()
    fs.rmSync(path.dirname(file), { recursive: true, force: true })
  })

  const parsed = (tags?: string[]) => ({
    artist: 'Cher',
    artistNorm: 'Cher',
    title: 'Believe',
    titleNorm: 'Believe',
    tags,
  })

  const tagsOf = (songId: number) =>
    db.get('SELECT tags FROM songs WHERE songId = ?', [songId]).tags

  it('stores tags on a new song', () => {
    const { songId } = Library.matchSong(parsed(['pop', '90s']))

    expect(tagsOf(songId)).toBe('["pop","90s"]')
  })

  it('updates tags when a matched song is rescanned after a rename', () => {
    const { songId } = Library.matchSong(parsed(['rock', '80s']))

    expect(tagsOf(songId)).toBe('["rock","80s"]')
  })

  it('defaults to an empty array when the filename has no taxonomy', () => {
    const { songId } = Library.matchSong(parsed())

    expect(tagsOf(songId)).toBe('[]')
  })

  it('sends tags to clients as a parsed array', () => {
    const { songId } = Library.matchSong(parsed(['jazz']))

    db.run(
      'INSERT INTO media (songId, pathId, relPath, duration) VALUES (?, 1, \'cher.mp4\', 180)',
      [songId],
    )
    Library.cache.version = null

    expect(Library.get().songs.entities[songId].tags).toEqual(['jazz'])
  })
})
