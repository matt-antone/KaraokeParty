import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db, open, close } from '../lib/Database.js'
import Rooms from './Rooms.js'

/**
 * A room decides who may join it. Before this default, a newly created room
 * had no role prefs at all, which meant nobody could self-register into it —
 * no guests, no new users — until an admin found Settings > Rooms > Edit and
 * turned it on. That makes the product's own premise ("scan the QR, type a
 * name, sing") unreachable on a fresh install. Both guest and standard signup
 * default on; a host who wants it tighter turns either off in that same screen.
 */

const roleId = (name: string) =>
  db.get<{ roleId: number }>('SELECT roleId FROM roles WHERE name = ?', [name])?.roleId

const prefsOf = (roomId: number) =>
  JSON.parse(db.get<{ data: string }>('SELECT data FROM rooms WHERE roomId = ?', [roomId])!.data).prefs

describe('room defaults', () => {
  beforeEach(() => {
    close()
    open({ file: ':memory:', ro: false })
  })

  afterEach(close)

  it('lets guests into a newly created room', async () => {
    await Rooms.set(null, { name: 'Living Room', status: 'open' })

    const room = db.get<{ roomId: number }>('SELECT roomId FROM rooms WHERE name = ?', ['Living Room'])!
    expect(prefsOf(room.roomId).roles[roleId('guest')!].allowNew).toBe(true)
  })

  it('lets new standard accounts into a newly created room', async () => {
    // a singer who wants a real account must not need an admin to enable it first
    await Rooms.set(null, { name: 'Living Room', status: 'open' })

    const room = db.get<{ roomId: number }>('SELECT roomId FROM rooms WHERE name = ?', ['Living Room'])!
    expect(prefsOf(room.roomId).roles[roleId('standard')!].allowNew).toBe(true)
  })

  it('respects role prefs the caller supplied', async () => {
    // an admin explicitly turning guests off must not be overridden
    const guest = roleId('guest')!
    await Rooms.set(null, {
      name: 'Locked Room',
      status: 'open',
      prefs: { roles: { [guest]: { allowNew: false } } },
    })

    const room = db.get<{ roomId: number }>('SELECT roomId FROM rooms WHERE name = ?', ['Locked Room'])!
    expect(prefsOf(room.roomId).roles[guest].allowNew).toBe(false)
  })

  it('does not re-apply the default when an existing room is edited', async () => {
    const guest = roleId('guest')!
    await Rooms.set(null, { name: 'Room', status: 'open' })
    const roomId = db.get<{ roomId: number }>('SELECT roomId FROM rooms WHERE name = ?', ['Room'])!.roomId

    // the host turns guests off later; that must stick
    await Rooms.set(roomId, {
      name: 'Room',
      status: 'open',
      prefs: { roles: { [guest]: { allowNew: false } } },
    })

    expect(prefsOf(roomId).roles[guest].allowNew).toBe(false)
  })

  it('lets guests into a room that predates role prefs', () => {
    // rooms stored before this default carry no 'roles' key at all. Defaulting
    // only on insert left every upgraded install's existing room refusing new
    // singers, which is the same dead end the insert default was added to fix.
    db.run(
      'INSERT INTO rooms (name, status, dateCreated, data) VALUES (?, ?, 0, ?)',
      ['Old Room', 'open', JSON.stringify({ prefs: { qr: { isEnabled: true } } })],
    )

    const roomId = db.get<{ roomId: number }>('SELECT roomId FROM rooms WHERE name = ?', ['Old Room'])!.roomId
    const roles = Rooms.get(roomId).entities[roomId].prefs.roles
    expect(roles[roleId('guest')!].allowNew).toBe(true)
    expect(roles[roleId('standard')!].allowNew).toBe(true)
  })

  it('does not override a room that turned guests off', () => {
    // an explicit 'roles' key is the host's decision; reading must not undo it
    const guest = roleId('guest')!
    db.run(
      'INSERT INTO rooms (name, status, dateCreated, data) VALUES (?, ?, 0, ?)',
      ['Locked', 'open', JSON.stringify({ prefs: { roles: { [guest]: { allowNew: false } } } })],
    )

    const roomId = db.get<{ roomId: number }>('SELECT roomId FROM rooms WHERE name = ?', ['Locked'])!.roomId
    expect(Rooms.get(roomId).entities[roomId].prefs.roles[guest].allowNew).toBe(false)
  })
})
