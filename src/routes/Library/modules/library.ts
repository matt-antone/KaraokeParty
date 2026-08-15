import { createAction, createReducer } from '@reduxjs/toolkit'
import {
  LIBRARY_FILTER_TAG,
  LIBRARY_FILTER_STRING,
  LIBRARY_FILTER_STRING_RESET,
  LIBRARY_FILTER_TOGGLE_STARRED,
  LIBRARY_SET_TAB,
  LIBRARY_PUSH,
  TOGGLE_ARTIST_EXPANDED,
  TOGGLE_ARTIST_RESULT_EXPANDED,
  SCROLL_ARTISTS,
} from 'shared/actionTypes'

// filename taxonomy is positional: Artist - Title [genre, decade, vocal, vibe, subgenre]
export const SONG_FACETS = ['genre', 'decade', 'vocal', 'vibe', 'subgenre']

// offered as filters, in display order; vocal is parsed but not filterable
export const FILTER_FACETS = ['genre', 'subgenre', 'decade', 'vibe']

// ------------------------------------
// Actions
// ------------------------------------
export const scrollArtists = createAction<number>(SCROLL_ARTISTS)
export const toggleArtistExpanded = createAction<number>(TOGGLE_ARTIST_EXPANDED)
export const toggleArtistResultExpanded = createAction<number>(TOGGLE_ARTIST_RESULT_EXPANDED)
const libraryPush = createAction<LibraryState>(LIBRARY_PUSH)

export const resetFilterStr = createAction(LIBRARY_FILTER_STRING_RESET)
export const toggleFilterStarred = createAction<void>(LIBRARY_FILTER_TOGGLE_STARRED)
export const setFilterTag = createAction<{ index: number, value: string }>(LIBRARY_FILTER_TAG)
export const setTab = createAction<LibraryTab>(LIBRARY_SET_TAB)
export const setFilterStr = createAction(LIBRARY_FILTER_STRING, (payload: string) => ({
  payload,
  meta: {
    throttle: {
      wait: 350,
      leading: false,
    },
  },
}))

// ------------------------------------
// Reducer
// ------------------------------------
export type LibraryTab = 'artists' | 'songs'

interface LibraryState {
  isLoading: boolean
  version: number
  filterStr: string
  filterStarred: boolean
  filterTags: string[] // by SONG_FACETS index; '' = any
  tab: LibraryTab
  scrollRow: number
  expandedArtists: number[]
  expandedArtistResults: number[]
}

const initialState: LibraryState = {
  isLoading: true,
  version: 0,
  filterStr: '',
  filterStarred: false,
  filterTags: SONG_FACETS.map(() => ''),
  tab: 'artists',
  scrollRow: 0,
  expandedArtists: [],
  expandedArtistResults: [],
}

const libraryReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setFilterStr, (state, { payload }) => {
      state.filterStr = payload
    })
    .addCase(resetFilterStr, (state) => {
      state.filterStr = ''
    })
    .addCase(toggleFilterStarred, (state) => {
      state.filterStarred = !state.filterStarred
    })
    .addCase(setFilterTag, (state, { payload }) => {
      state.filterTags[payload.index] = payload.value
    })
    .addCase(setTab, (state, { payload }) => {
      state.tab = payload
    })
    .addCase(scrollArtists, (state, { payload }) => {
      state.scrollRow = payload
    })
    .addCase(toggleArtistExpanded, (state, { payload }) => {
      const idx = state.expandedArtists.indexOf(payload)

      if (idx === -1) state.expandedArtists.push(payload)
      else state.expandedArtists.splice(idx, 1)
    })
    .addCase(toggleArtistResultExpanded, (state, { payload }) => {
      const idx = state.expandedArtistResults.indexOf(payload)

      if (idx === -1) state.expandedArtistResults.push(payload)
      else state.expandedArtistResults.splice(idx, 1)
    })
    .addCase(libraryPush, (state, { payload }) => ({
      ...state,
      isLoading: false,
      version: payload.version,
    }))
})

export default libraryReducer
