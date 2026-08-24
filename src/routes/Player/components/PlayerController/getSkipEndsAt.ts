import type { PlayerState } from '../../modules/player'

// how long the pause between songs lasts
// ponytail: fixed pause between songs; make it a room pref if hosts want to tune it
export const INTERMISSION_MS = 15000

// a skip gets the same intermission as a song ending, so the next singer has time to get to
// the mic. Derived from the skip command's own timestamp: reacting to the skip by *storing*
// an intermission would mean setting state in an effect. null = load the next song now, which
// is also what a skip at the end of the queue or during an intermission (host's done waiting)
// should do
const getSkipEndsAt = (player: PlayerState, hasNextItem: boolean, isIntermission: boolean) =>
  player._isPlayingNext && hasNextItem && !isIntermission ? player._lastSkipTime + INTERMISSION_MS : null

export default getSkipEndsAt
