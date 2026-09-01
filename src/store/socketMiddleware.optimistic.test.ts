// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { configureStore, type UnknownAction } from '@reduxjs/toolkit'
import { ensureState } from 'redux-optimistic-ui'
import type { Socket } from 'socket.io-client'
// reducers -> user -> AppRouter -> App -> store/store -> reducers is a cycle;
// importing the reducers first hands configureStore an undefined reducer. Enter
// where the app does. (Same reason as QueueItem.store.test.tsx.)
import 'store/store'
import rootReducer from 'store/reducers'
import createSocketMiddleware from 'store/socketMiddleware'
import { toggleSongStarred } from 'store/modules/userStars'
import { STAR_SONG, _ERROR, _SUCCESS } from 'shared/actionTypes'

/**
 * QueueItem.store.test.tsx proves the BEGIN half of the optimistic cycle: a star
 * lands in local state before the server has said anything. Its socket stub
 * drops socket.io's acknowledgement callback, so the server never answers and
 * COMMIT/REVERT never run. These hold onto that callback instead.
 *
 * The callback is a real path, not a testing fiction: server/socket.ts:84-107
 * hands every handler an `acknowledge`, answers an unauthenticated client with
 * SOCKET_AUTH_ERROR, and turns any throw into `{ type: type + _ERROR, error }`.
 * server/Library/socket.ts calls Library.starSong() before acknowledging, so a
 * star is exactly one thrown query away from being NAKed. The middleware keys
 * off `cbAction.error` alone (src/store/socketMiddleware.ts:32).
 */

const SONG_ID = 2
const OTHER_SONG_ID = 5

const makeStore = () => {
  const acks: Array<(action: UnknownAction) => void> = []

  const socket = {
    on: () => {},
    // socket.io's third emit argument is the acknowledgement callback: the
    // server's only way back to this client about this one request.
    emit: (event: string, action: UnknownAction, ack: (action: UnknownAction) => void) => acks.push(ack),
  } as unknown as Socket

  const store = configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware => getDefaultMiddleware()
      .concat(createSocketMiddleware(socket, 'server/')),
  })

  return { store, acks }
}

/** the two answers server/socket.ts can give a star */
const ACK_OK = { type: STAR_SONG + _SUCCESS }
const ACK_ERR = { type: STAR_SONG + _ERROR, error: `Error in ${STAR_SONG}: no such song` }

const starsIn = (store: ReturnType<typeof makeStore>['store']) =>
  ensureState(store.getState().userStars).starredSongs

describe('the optimistic cycle, once the server answers', () => {
  it('keeps the star and stops holding a rollback for it when the server commits', async () => {
    const { store, acks } = makeStore()
    await store.dispatch(toggleSongStarred(SONG_ID))

    acks[0](ACK_OK)

    expect(starsIn(store)).toEqual([SONG_ID])
    // committed, not merely still-pending: there is no longer a before-state to
    // fall back to, so nothing can take this star away again
    expect(store.getState().userStars.history).toEqual([])
    expect(store.getState().userStars.beforeState).toBeUndefined()
  })

  it('takes the star back when the server rejects it', async () => {
    const { store, acks } = makeStore()
    await store.dispatch(toggleSongStarred(SONG_ID))

    acks[0](ACK_ERR)

    expect(starsIn(store)).toEqual([])
    expect(store.getState().userStars.history).toEqual([])
  })

  it('reverts the star the server actually rejected, not whichever was last', async () => {
    const { store, acks } = makeStore()
    await store.dispatch(toggleSongStarred(SONG_ID))
    await store.dispatch(toggleSongStarred(OTHER_SONG_ID))
    expect(starsIn(store)).toEqual([SONG_ID, OTHER_SONG_ID])

    // the server rejects the FIRST star; only that one may roll back
    acks[0](ACK_ERR)

    // Regression guard. transactionID is a module-level counter, and the ack
    // closure used to read it when the ack *fired* rather than capturing the
    // id it emitted with — by then the second star had bumped it, so this
    // REVERT carried the second star's id: the rejected star survived and the
    // untouched one was discarded, backwards in both halves. The middleware
    // now claims its id before emitting.
    expect(starsIn(store)).toEqual([OTHER_SONG_ID])
  })
})
