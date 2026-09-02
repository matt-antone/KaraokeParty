import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database, { db, open, close } from '../lib/Database.js'
import Library from './Library.js'

const USER_ID = 1

const addSong = (title = 'Here Comes The Rain Again', titleNorm = 'here comes the rain again') => {
  db.run('INSERT INTO songs (artistId, title, titleNorm) VALUES (1, ?, ?)', [title, titleNorm])
  return db.get<{ songId: number }>('SELECT MAX(songId) AS songId FROM songs').songId
}

describe('song stars survive songId churn', () => {
  beforeEach(() => {
    if (Database.db) close()
    open({ file: ':memory:', ro: false })

    db.run(`INSERT INTO users (userId, username, password, name, roleId)
      VALUES (?, ?, ?, ?, (SELECT roleId FROM roles WHERE name = 'standard'))`,
    [USER_ID, 'dot', 'x', 'Dot Matrix'])
    db.run('INSERT INTO artists (artistId, name, nameNorm) VALUES (1, ?, ?)', ['Eurythmics', 'eurythmics'])

    Library.starCountsCache = { version: null }
  })

  afterEach(close)

  it('resolves a star to the song it was set on', () => {
    const songId = addSong()
    Library.starSong(songId, USER_ID)

    expect(Library.getUserStars(USER_ID).starredSongs).toEqual([songId])
    expect(Library.getStarCounts().songs).toEqual({ [songId]: 1 })
  })

  it('follows the song when a rescan re-mints its songId', () => {
    const songId = addSong()
    Library.starSong(songId, USER_ID)

    // what a rename + rescan does: the old row loses its media and is cleaned up,
    // the same artist/title comes back under a new songId
    db.run('DELETE FROM songs WHERE songId = ?', [songId])
    const newSongId = addSong()
    expect(newSongId).not.toBe(songId)

    Library.starCountsCache = { version: null }
    expect(Library.getUserStars(USER_ID).starredSongs).toEqual([newSongId])
    expect(Library.getStarCounts().songs).toEqual({ [newSongId]: 1 })
  })

  it('keeps the star while the song is missing entirely', () => {
    const songId = addSong()
    Library.starSong(songId, USER_ID)

    db.run('DELETE FROM songs WHERE songId = ?', [songId])
    expect(Library.getUserStars(USER_ID).starredSongs).toEqual([])

    expect(addSong()).toBeGreaterThan(songId)
    expect(Library.getUserStars(USER_ID).starredSongs).toHaveLength(1)
  })

  it('unstars by songId', () => {
    const songId = addSong()
    Library.starSong(songId, USER_ID)

    expect(Library.unstarSong(songId, USER_ID)).toBe(1)
    expect(Library.getUserStars(USER_ID).starredSongs).toEqual([])
  })

  it('doesn\'t unstar a different song by the same artist', () => {
    const rain = addSong()
    const sweet = addSong('Sweet Dreams', 'sweet dreams')
    Library.starSong(rain, USER_ID)

    expect(Library.unstarSong(sweet, USER_ID)).toBe(0)
    expect(Library.getUserStars(USER_ID).starredSongs).toEqual([rain])
  })
})

describe('getPathSongCounts', () => {
  beforeEach(() => {
    if (Database.db) close()
    open({ file: ':memory:', ro: false })

    db.run('INSERT INTO artists (artistId, name, nameNorm) VALUES (1, ?, ?)', ['Eurythmics', 'eurythmics'])
    db.run('INSERT INTO paths (pathId, path, priority) VALUES (1, ?, 0)', ['/media/karaoke'])
    db.run('INSERT INTO paths (pathId, path, priority) VALUES (2, ?, 1)', ['/media/new'])
  })

  afterEach(close)

  const addMedia = (pathId: number, songId: number, relPath: string) => {
    db.run(
      'INSERT INTO media (songId, pathId, relPath, duration) VALUES (?, ?, ?, ?)',
      [songId, pathId, relPath, 180],
    )
  }

  it('counts distinct songs per path, not media rows', () => {
    const rain = addSong()
    const sweet = addSong('Sweet Dreams', 'sweet dreams')

    // rain has two media files under the same path (e.g. .cdg + .mp3) — one song
    addMedia(1, rain, 'rain.cdg')
    addMedia(1, rain, 'rain.mp3')
    addMedia(1, sweet, 'sweet.mp4')
    addMedia(2, sweet, 'sweet-copy.mp4')

    expect(Library.getPathSongCounts()).toEqual({ 1: 2, 2: 1 })
  })

  it('omits a path with no media entirely', () => {
    const rain = addSong()
    addMedia(1, rain, 'rain.mp4')

    expect(Library.getPathSongCounts()).toEqual({ 1: 1 })
  })
})
