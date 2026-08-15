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
    const text = render().replace(/<[^>]+>/g, '') // ColorCycle wraps every character in a span
    expect(text).toContain('DOT MATRIX')
    expect(text).not.toContain('UP NEXT')
  })

  it('lists the two singers after the next one under "Coming Up"', () => {
    const text = render().replace(/<[^>]+>/g, '')
    expect(text).toContain('Coming Up')
    expect(text).toContain('Barf')
    expect(text).toContain('Lone Starr')
  })
})

describe('PlayerTextOverlay up next', () => {
  const playing = { intermissionEndsAt: null as number | null }

  it('teases the next singer only when the song is ending', () => {
    expect(render({ ...playing, isSongEnding: false })).not.toContain('Up Next:')
    expect(render({ ...playing, isSongEnding: true })).toContain('Up Next:')
  })

  it('names the next singer', () => {
    const text = render({ ...playing, isSongEnding: true }).replace(/<[^>]+>/g, '')
    expect(text).toContain('Up Next: Dot Matrix')
  })
})
