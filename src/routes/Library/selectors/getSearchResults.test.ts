import { describe, it, expect } from 'vitest'
import getSearchResults from './getSearchResults'
import libraryReducer, { setFilterTag, SONG_FACETS } from '../modules/library'

// [genre, decade, vibe]
const SONGS = {
  1: { songId: 1, artistId: 1, title: 'Believe', tags: ['pop', '90s'], duration: 214, numMedia: 1 },
  2: { songId: 2, artistId: 1, title: 'Strong Enough', tags: ['pop', '90s', 'dance'], duration: 223, numMedia: 1 },
  3: { songId: 3, artistId: 2, title: 'Come As You Are', tags: ['grunge', '90s'], duration: 219, numMedia: 1 },
  4: { songId: 4, artistId: 3, title: 'Fly Me To The Moon', tags: ['jazz', '60s', 'mellow'], duration: 148, numMedia: 1 },
  5: { songId: 5, artistId: 4, title: 'Bohemian Rhapsody', tags: [], duration: 355, numMedia: 1 },
}

const state = (filterTags: string[]) => ({
  artists: {
    result: [1, 2, 3, 4],
    entities: {
      1: { artistId: 1, name: 'Cher', songIds: [1, 2] },
      2: { artistId: 2, name: 'Nirvana', songIds: [3] },
      3: { artistId: 3, name: 'Frank Sinatra', songIds: [4] },
      4: { artistId: 4, name: 'Queen', songIds: [5] },
    },
  },
  songs: { result: [1, 2, 3, 4, 5], entities: SONGS },
  library: { filterStr: '', filterStarred: false, filterTags },
  userStars: { starredArtists: [], starredSongs: [] },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any

const songsFor = (filterTags: string[]) => getSearchResults(state(filterTags)).songsResult
const artistsFor = (filterTags: string[]) => getSearchResults(state(filterTags)).artistsResult

describe('taxonomy filters', () => {
  it('returns everything when no facet is selected', () => {
    expect(songsFor(['', '', ''])).toEqual([1, 2, 3, 4, 5])
  })

  it('filters on a single facet', () => {
    expect(songsFor(['pop', '', ''])).toEqual([1, 2])
  })

  it('matches each facet against its own position, not any position', () => {
    // '90s' is a decade; selecting it as a genre must match nothing
    expect(songsFor(['90s', '', ''])).toEqual([])
    expect(songsFor(['', '90s', ''])).toEqual([1, 2, 3])
  })

  it('ANDs facets together', () => {
    expect(songsFor(['pop', '90s', 'dance'])).toEqual([2])
    expect(songsFor(['grunge', '60s', ''])).toEqual([])
  })

  it('excludes songs missing the facet being filtered', () => {
    // songs 1 and 3 have no vibe; song 5 has no tags at all
    expect(songsFor(['', '', 'dance'])).toEqual([2])
  })

  it('drops artists left with no matching songs', () => {
    expect(artistsFor(['pop', '', ''])).toEqual([1])
    expect(artistsFor(['', '90s', ''])).toEqual([1, 2])
  })
})

describe('filterTags reducer', () => {
  it('starts with one empty slot per facet', () => {
    const { filterTags } = libraryReducer(undefined, { type: '@@INIT' })

    expect(filterTags).toEqual(['', '', ''])
    expect(filterTags).toHaveLength(SONG_FACETS.length)
  })

  it('sets one facet without disturbing the others', () => {
    let s = libraryReducer(undefined, setFilterTag({ index: 0, value: 'pop' }))
    s = libraryReducer(s, setFilterTag({ index: 2, value: 'dance' }))

    expect(s.filterTags).toEqual(['pop', '', 'dance'])
  })

  it('clears a facet back to any', () => {
    let s = libraryReducer(undefined, setFilterTag({ index: 0, value: 'pop' }))
    s = libraryReducer(s, setFilterTag({ index: 0, value: '' }))

    expect(s.filterTags).toEqual(['', '', ''])
  })
})
