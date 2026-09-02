import { describe, it, expect } from 'vitest'
import getSearchResults from './getSearchResults'

const SONGS = {
  1: { songId: 1, artistId: 1, title: 'Believe', tags: ['pop', '90s'], duration: 214, numMedia: 1 },
  2: { songId: 2, artistId: 1, title: 'Strong Enough', tags: ['pop', '90s', 'dance'], duration: 223, numMedia: 1 },
  3: { songId: 3, artistId: 2, title: 'Come As You Are', tags: ['grunge', '90s'], duration: 219, numMedia: 1 },
  4: { songId: 4, artistId: 3, title: 'Fly Me To The Moon', tags: ['jazz', '60s', 'mellow'], duration: 148, numMedia: 1 },
  5: { songId: 5, artistId: 4, title: 'Bohemian Rhapsody', tags: [] as string[], duration: 355, numMedia: 1 },
}

const state = (stars: {
  filterStarred?: boolean
  starredArtists?: number[]
  starredSongs?: number[]
} = {}) => ({
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
  library: { filterStr: '', filterStarred: !!stars.filterStarred },
  userStars: {
    starredArtists: stars.starredArtists ?? [],
    starredSongs: stars.starredSongs ?? [],
  },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any

describe('starred filter', () => {
  const starred = (starredSongs: number[]) =>
    getSearchResults(state({ filterStarred: true, starredSongs }))

  it('keeps only starred songs', () => {
    expect(starred([2, 4]).songsResult).toEqual([2, 4])
  })

  // nothing in the UI stars an artist, so artist stars are always empty in practice
  it('keeps artists whose songs are starred, without any artist star', () => {
    expect(starred([2]).artistsResult).toEqual([1])
  })

  it('still honors an explicit artist star', () => {
    const s = state({ filterStarred: true, starredArtists: [2], starredSongs: [] })
    expect(getSearchResults(s).artistsResult).toEqual([2])
  })

  it('shows nothing when the user has starred nothing', () => {
    expect(starred([])).toEqual({ artistsResult: [], songsResult: [] })
  })
})
