import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Provider } from 'react-redux'
import { describe, it, expect } from 'vitest'
import PlayerTextOverlay from './PlayerTextOverlay'
import type { QueueItem } from 'shared/types'

// UserImage builds its src from document.baseURI
globalThis.document = { baseURI: 'http://localhost/' } as Document

// just enough store for the connected component's hooks
const store = {
  getState: () => ({}),
  subscribe: () => () => {},
  dispatch: () => {},
} as never

const nextQueueItem = {
  queueId: 2,
  userId: 42,
  userDisplayName: 'Dot Matrix',
  userDateUpdated: 1234,
} as QueueItem

const comingUpQueueItems = [
  { queueId: 3, userId: 43, userDisplayName: 'Barf', userDateUpdated: 1 },
  { queueId: 4, userId: 44, userDisplayName: 'Lone Starr', userDateUpdated: 1 },
] as QueueItem[]

const render = (props = {}) => renderToStaticMarkup(
  <Provider store={store}>
    <PlayerTextOverlay
      queueItem={{ queueId: 1 } as QueueItem}
      nextQueueItem={nextQueueItem}
      comingUpQueueItems={comingUpQueueItems}
      isAtQueueEnd={false}
      isQueueEmpty={false}
      isErrored={false}
      intermissionEndsAt={Date.now() + 10000}
      nextSongTitle='Spaceballs the Song'
      nextSongArtist='Winnebago'
      width={1280}
      height={720}
      {...props}
    />
  </Provider>,
)

describe('PlayerTextOverlay intermission', () => {
  it('shows the next singer\'s image', () => {
    expect(render()).toContain('api/user/42/image?v=1234')
  })

  it('shows the next singer\'s name without an "up next" prefix', () => {
    const text = render().replace(/<[^>]+>/g, '')
    expect(text).toContain('Dot Matrix')
    expect(text).not.toContain('up next')
  })

  it('names the next song and artist above the singer', () => {
    const text = render().replace(/<[^>]+>/g, '')
    expect(text.indexOf('Spaceballs the Song')).toBeLessThan(text.indexOf('Dot Matrix'))
    expect(text).toContain('Winnebago')
  })

  it('lists the two singers and their songs after the next one under "Coming Up"', () => {
    const text = render({
      comingUpSongTitles: ['Ludicrous Speed', 'Combing the Desert'],
    }).replace(/<[^>]+>/g, '')

    expect(text).toContain('coming up')
    expect(text).toContain('Barf — Ludicrous Speed')
    expect(text).toContain('Lone Starr — Combing the Desert')
  })
})

describe('PlayerTextOverlay up next', () => {
  const playing = { intermissionEndsAt: null as number | null }

  it('teases the next singer only when the song is ending', () => {
    expect(render({ ...playing, isSongEnding: false })).not.toContain('up next')
    expect(render({ ...playing, isSongEnding: true })).toContain('up next')
  })

  it('names the next singer and their song', () => {
    const text = render({ ...playing, isSongEnding: true }).replace(/<[^>]+>/g, '')
    expect(text).toContain('Dot Matrix')
    expect(text).toContain('Spaceballs the Song')
  })
})

describe('PlayerTextOverlay queue depth', () => {
  const playing = { intermissionEndsAt: null as number | null }

  it('hides the meter when nothing is queued', () => {
    expect(render({ ...playing, queueDepth: 0 })).not.toContain('role="meter"')
  })

  it('shows the meter and the zero-padded count when songs are still to come', () => {
    const markup = render({ ...playing, queueDepth: 8 })
    expect(markup).toContain('role="meter"')
    expect(markup.replace(/<[^>]+>/g, '')).toContain('queue 08')
  })

  it('reports a fault instead of joking about it', () => {
    // "The player states what happened." Where the old brand said OOPS...,
    // DECK reports: a silkscreen FAULT over what broke and where to look.
    const html = render({ isErrored: true })

    expect(html).toContain('fault')
    expect(html).toContain('Media failed')
    expect(html).toContain('see the queue for details')
  })

  it('shows the fault alone — the six states are mutually exclusive', () => {
    // errored outranks intermission, upNextTease and upNow. Before the rebuild
    // an if/else chain let upNow and upNextTease render together.
    const html = render({
      isErrored: true,
      intermissionEndsAt: Date.now() + 10000,
      isSongEnding: true,
    })

    expect(html).toContain('Media failed')
    expect(html).not.toContain('coming up')
    expect(html).not.toContain('up next')
    expect(html).not.toContain('on stage')
  })

  it('yields to an empty queue, which is not a fault', () => {
    // a queue that ran out is not broken media, and must not read as one
    const html = render({ isErrored: true, isQueueEmpty: true })

    expect(html).toContain('queue empty')
    expect(html).not.toContain('Media failed')
  })
})
