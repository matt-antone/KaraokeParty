import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database, { db, open, close } from '../lib/Database.js'
import Rooms from './Rooms.js'

/**
 * A room decides who may join it. Before this default, a newly created room
 * had no role prefs at all, which meant nobody could self-register into it —
 * no guests, no new users — until an admin found Settings > Rooms > Edit and
 * turned it on. That makes the product's own premise ("scan the QR, type a
 * name, sing") unreachable on a fresh install.
 */

const roleId = (name: string) =>
  db.get<{ roleId: number }>('SELECT roleId FROM roles WHERE name = ?', [name])?.roleId

const prefsOf = (roomId: number) =>
  JSON.parse(db.get<{ data: string }>('SELECT data FROM rooms WHERE roomId = ?', [roomId])!.data).prefs

describe('room defaults', () => {
  beforeEach(() => {
    if (Database.db) close()
    open({ file: ':memory:', ro: false })
  })

  afterEach(close)

  it('lets guests into a newly created room', async () => {
    await Rooms.set(null, { name: 'Living Room', status: 'open' })

    const room = db.get<{ roomId: number }>('SELECT roomId FROM rooms WHERE name = ?', ['Living Room'])!
    expect(prefsOf(room.roomId).roles[roleId('guest')!].allowNew).toBe(true)
  })

  it('does not let standard accounts in by default', async () => {
    // a guest is one field; a standard account is a commitment the host opts into
    await Rooms.set(null, { name: 'Living Room', status: 'open' })

    const room = db.get<{ roomId: number }>('SELECT roomId FROM rooms WHERE name = ?', ['Living Room'])!
    expect(prefsOf(room.roomId).roles[roleId('standard')!]).toBeUndefined()
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
})
