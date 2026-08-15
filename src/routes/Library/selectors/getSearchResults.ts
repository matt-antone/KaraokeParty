import { ensureState } from 'redux-optimistic-ui'
import { createSelector } from '@reduxjs/toolkit'
import { Searcher } from 'fast-fuzzy'
import { RootState } from 'store/store'

const getArtists = (state: RootState) => state.artists
const getSongs = (state: RootState) => state.songs
const getFilterStr = (state: RootState) => state.library.filterStr.trim().toLowerCase()
const getFilterStarred = (state: RootState) => state.library.filterStarred
const getFilterTags = (state: RootState) => state.library.filterTags
const getStarredArtists = (state: RootState) => ensureState(state.userStars).starredArtists
const getStarredSongs = (state: RootState) => ensureState(state.userStars).starredSongs

const getArtistSearcher = createSelector(
  [getArtists],
  artists => new Searcher(artists.result as unknown as object[], {
    keySelector: ((artistId: number) => artists.entities[artistId].name) as unknown as (s: object) => string,
    threshold: 0.8,
  }),
)

const getSongSearcher = createSelector(
  [getSongs],
  songs => new Searcher(songs.result as unknown as object[], {
    keySelector: ((songId: number) => songs.entities[songId].title) as unknown as (s: object) => string,
    threshold: 0.8,
  }),
)

// #1: keyword filters
const getArtistsByKeyword = createSelector(
  [getArtists, getFilterStr, getArtistSearcher],
  (artists, str, searcher) => {
    if (!str) return artists.result

    return searcher.search(str, {
      returnMatchData: true,
    }).map(match => match.item as unknown as number)
  })

const getSongsByKeyword = createSelector(
  [getSongs, getFilterStr, getSongSearcher],
  (songs, str, searcher) => {
    if (!str) return songs.result

    return searcher.search(str, {
      returnMatchData: true,
    }).map(match => match.item as unknown as number)
  })

// #2: taxonomy filters; each selected facet must match the tag at its position
const getSongsByTags = createSelector(
  [getSongsByKeyword, getSongs, getFilterTags],
  (songsWithKeyword, songs, filterTags) => {
    if (!filterTags.some(Boolean)) return songsWithKeyword

    return songsWithKeyword.filter(songId =>
      filterTags.every((tag, i) => !tag || songs.entities[songId].tags[i] === tag))
  })

// drop artists left with no matching songs, else they'd list as empty results
const getArtistsByTags = createSelector(
  [getArtistsByKeyword, getSongsByTags, getSongs, getFilterTags],
  (artistsWithKeyword, songsWithTags, songs, filterTags) => {
    if (!filterTags.some(Boolean)) return artistsWithKeyword

    const artistIds = new Set(songsWithTags.map(songId => songs.entities[songId].artistId))
    return artistsWithKeyword.filter(artistId => artistIds.has(artistId))
  })

// #3: starred/hidden filters
const getArtistsByView = createSelector(
  [getArtistsByTags, getFilterStarred, getStarredArtists],
  (artistsWithTags, filterStarred, starredArtists) =>
    artistsWithTags.filter((artistId) => {
      return filterStarred ? starredArtists.includes(artistId) : true
    }),
)

const getSongsByView = createSelector(
  [getSongsByTags, getFilterStarred, getStarredSongs],
  (songsWithTags, filterStarred, starredSongs) =>
    songsWithTags.filter((songId) => {
      return filterStarred ? starredSongs.includes(songId) : true
    }),
)

// options offered per facet: values present among songs matching every *other* active
// filter, so choosing one facet narrows the rest (the selected value always survives)
export const getFacetValues = createSelector(
  [getSongsByKeyword, getSongs, getFilterTags, getFilterStarred, getStarredSongs],
  (songIds, songs, filterTags, filterStarred, starredSongs) =>
    filterTags.map((_, i) => [...new Set(songIds
      .filter(songId => (!filterStarred || starredSongs.includes(songId))
        && filterTags.every((tag, j) => j === i || !tag || songs.entities[songId].tags[j] === tag))
      .map(songId => songs.entities[songId].tags[i])
      .filter(Boolean))].sort()),
)

const getSearchResults = createSelector(
  [getArtistsByView, getSongsByView],
  (artistsResult, songsResult) => ({
    artistsResult,
    songsResult,
  }),
)

export default getSearchResults
