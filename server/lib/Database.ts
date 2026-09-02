import path from 'path'
import fs from 'node:fs'
import { DatabaseSync } from 'node:sqlite' // eslint-disable-line n/no-unsupported-features/node-builtins
import getLogger from './Log.js'

type SqlParam = string | number | bigint | null | Uint8Array

const log = getLogger('db')

const toArgs = (params: unknown[] | Record<string, unknown>) =>
  (Array.isArray(params) ? params : [params]) as SqlParam[]

// not set until open(); every consumer runs after that, as it did before
export let db: DatabaseWrapper

class DatabaseWrapper {
  private db: DatabaseSync
  public config: { filename: string }

  constructor (file: string) {
    this.config = { filename: file }
    this.db = new DatabaseSync(file)
  }

  close () {
    this.db.close()
  }

  all<T = unknown> (sql: string, params: unknown[] | Record<string, unknown> = []) {
    return this.db.prepare(sql).all(...toArgs(params)) as T[]
  }

  run (sql: string, params: unknown[] | Record<string, unknown> = []) {
    const res = this.db.prepare(sql).run(...toArgs(params))
    return { lastID: Number(res.lastInsertRowid), changes: Number(res.changes) }
  }

  get<T = unknown> (sql: string, params: unknown[] | Record<string, unknown> = []) {
    return this.db.prepare(sql).get(...toArgs(params)) as T | undefined
  }

  exec (sql: string) {
    this.db.exec(sql)
  }

  migrate (migrationsPath: string) {
    this.db.exec(`CREATE TABLE IF NOT EXISTS "migrations" (
      id INTEGER PRIMARY KEY,
      name TEXT,
      up TEXT,
      down TEXT
    )`)

    const migrations = fs.readdirSync(migrationsPath)
      .map(file => ({ file, match: file.match(/^(\d+)-(.*)\.sql$/) }))
      .filter(m => m.match)
      .map(({ file, match }) => {
        const [up, down = ''] = fs.readFileSync(path.join(migrationsPath, file), 'utf8')
          .split(/^--\s*Down/mi)

        return {
          id: parseInt(match[1], 10),
          name: match[2],
          up: up.replace(/^--\s*Up/mi, '').trim(),
          down: down.trim(),
        }
      })
      .sort((a, b) => a.id - b.id)

    const inTransaction = (sql: string, after: () => void) => {
      this.exec('BEGIN')
      try {
        this.exec(sql)
        after()
        this.exec('COMMIT')
      } catch (err) {
        this.exec('ROLLBACK')
        throw err
      }
    }

    let applied = this.all<{ id: number, name: string, down: string }>(
      'SELECT id, name, down FROM "migrations" ORDER BY id ASC',
    )

    // roll back anything this build no longer ships, newest first, so an older
    // build run against a newer database gets its schema back rather than data loss
    for (const m of [...applied].reverse()) {
      if (migrations.some(x => x.id === m.id)) break

      log.info('Running down migration %s: %s', m.id, m.name)
      inTransaction(m.down, () => this.run('DELETE FROM "migrations" WHERE id = ?', [m.id]))
      applied = applied.filter(x => x.id !== m.id)
    }

    const appliedIds = new Set(applied.map(m => m.id))

    for (const m of migrations) {
      if (appliedIds.has(m.id)) continue

      log.info('Running migration %s: %s', m.id, m.name)
      inTransaction(m.up, () => this.run(
        'INSERT INTO "migrations" (id, name, up, down) VALUES (?, ?, ?, ?)',
        [m.id, m.name, m.up, m.down || null],
      ))
    }
  }
}

export function close () {
  if (!db) return
  log.info('Closing database file %s', db.config.filename)
  db.close()
  db = undefined as unknown as DatabaseWrapper
}

export function open ({ file, ro = true }: { file: string, ro?: boolean }) {
  if (db) throw new Error('Database already open')
  log.info('Opening database file %s %s', ro ? '(read-only)' : '(writeable)', file)

  // create path if it doesn't exist
  fs.mkdirSync(path.dirname(file), { recursive: true })

  db = new DatabaseWrapper(file)

  if (!ro) {
    db.migrate(path.join(import.meta.dirname, 'schemas'))
    db.exec('PRAGMA journal_mode = WAL;')
    db.exec('PRAGMA foreign_keys = ON;')
  }

  return db
}
