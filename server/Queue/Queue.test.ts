import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db, open, close } from '../lib/Database.js'
import Queue from './Queue.js'

const ROOM_ID = 1
const ALICE = 1
const BOB = 2

describe('singer pause', () => {
  beforeEach(() => {
    close()
    open({ file: ':memory:', ro: false })

    db.run('INSERT INTO rooms (roomId, name, status) VALUES (?, ?, ?)', [ROOM_ID, 'Room', 'open'])
    db.run(`INSERT INTO users (userId, username, password, name, roleId)
      VALUES (?, ?, ?, ?, (SELECT roleId FROM roles WHERE name = 'standard'))`, [ALICE, 'alice', 'x', 'Alice'])
    db.run(`INSERT INTO users (userId, username, password, name, roleId)
      VALUES (?, ?, ?, ?, (SELECT roleId FROM roles WHERE name = 'standard'))`, [BOB, 'bob', 'x', 'Bob'])
    db.run('INSERT INTO artists (artistId, name, nameNorm) VALUES (1, ?, ?)', ['Eurythmics', 'eurythmics'])
    db.run('INSERT INTO songs (songId, artistId, title, titleNorm) VALUES (10, 1, ?, ?)', ['Sweet Dreams', 'sweet dreams'])
    db.run('INSERT INTO paths (pathId, path, priority, data) VALUES (1, ?, 1, ?)', ['/media', '{}'])
    db.run('INSERT INTO media (mediaId, songId, pathId, relPath, duration, isPreferred) VALUES (100, 10, 1, ?, 60, 1)', ['a.mp4'])
  })

  afterEach(close)

  it('has nobody paused to start', () => {
    Queue.add({ roomId: ROOM_ID, songId: 10, userId: ALICE })
    expect(Queue.get(ROOM_ID).pausedUserIds).toEqual([])
  })

  it('pauses and resumes a singer without touching their songs', () => {
    Queue.add({ roomId: ROOM_ID, songId: 10, userId: BOB })

    Queue.setPaused({ isPaused: true, roomId: ROOM_ID, userId: BOB })
    Queue.setPaused({ isPaused: true, roomId: ROOM_ID, userId: BOB }) // idempotent
    expect(Queue.get(ROOM_ID).pausedUserIds).toEqual([BOB])
    expect(Queue.get(ROOM_ID).result).toHaveLength(1)

    Queue.setPaused({ isPaused: false, roomId: ROOM_ID, userId: BOB })
    expect(Queue.get(ROOM_ID).pausedUserIds).toEqual([])
    expect(Queue.get(ROOM_ID).result).toHaveLength(1)
  })
})

describe('move', () => {
  beforeEach(() => {
    close()
    open({ file: ':memory:', ro: false })

    db.run('INSERT INTO rooms (roomId, name, status) VALUES (?, ?, ?)', [ROOM_ID, 'Room', 'open'])
    db.run(`INSERT INTO users (userId, username, password, name, roleId)
      VALUES (?, ?, ?, ?, (SELECT roleId FROM roles WHERE name = 'standard'))`, [ALICE, 'alice', 'x', 'Alice'])
    db.run('INSERT INTO artists (artistId, name, nameNorm) VALUES (1, ?, ?)', ['Eurythmics', 'eurythmics'])
    db.run('INSERT INTO songs (songId, artistId, title, titleNorm) VALUES (10, 1, ?, ?)', ['Sweet Dreams', 'sweet dreams'])
    db.run('INSERT INTO paths (pathId, path, priority, data) VALUES (1, ?, 1, ?)', ['/media', '{}'])
    db.run('INSERT INTO media (mediaId, songId, pathId, relPath, duration, isPreferred) VALUES (100, 10, 1, ?, 60, 1)', ['a.mp4'])

    for (let i = 0; i < 3; i++) Queue.add({ roomId: ROOM_ID, songId: 10, userId: ALICE })
  })

  afterEach(close)

  it('starts in insertion order', () => {
    expect(Queue.get(ROOM_ID).result).toEqual([1, 2, 3])
  })

  it('moves an item to the end', () => {
    Queue.move({ prevQueueId: 3, queueId: 1, roomId: ROOM_ID })
    expect(Queue.get(ROOM_ID).result).toEqual([2, 3, 1])
  })

  it('moves an item to the top', () => {
    Queue.move({ prevQueueId: null, queueId: 3, roomId: ROOM_ID })
    expect(Queue.get(ROOM_ID).result).toEqual([3, 1, 2])
  })

  it('moves the first item into the middle', () => {
    Queue.move({ prevQueueId: 2, queueId: 1, roomId: ROOM_ID })
    expect(Queue.get(ROOM_ID).result).toEqual([2, 1, 3])
  })
})
