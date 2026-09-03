import { useEffect, useState } from 'react'
import { useAppSelector } from 'store/hooks'
import type { TriviaResult, TriviaRound } from 'shared/types'

/**
 * The trivia round on screen right now, or nothing.
 *
 * The store keeps the last round and result until the next ones arrive, which
 * is right for a store and wrong for a screen: a finished round would keep
 * showing through the following song's intermission. Expiry is a matter of
 * time passing, so it belongs in a hook rather than a reducer — and both
 * surfaces that draw a round need the same answer, so it lives in one.
 *
 * One timer, armed for the exact moment the round ends, rather than a tick:
 * nothing on either screen counts in anything finer than whole seconds, and
 * those components run their own tick while they are mounted.
 */
export default function useTriviaStage (): { round: TriviaRound | null, result: TriviaResult | null } {
  const round = useAppSelector(state => state.trivia.round)
  const result = useAppSelector(state => state.trivia.result)
  const endsAt = result?.endsAt ?? round?.endsAt ?? 0

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!endsAt) return

    // Math.max rather than an early return for the already-expired case: a
    // payload that arrives late still has to move `now` past it, and a zero
    // timeout does that on the next tick instead of setting state inside the
    // effect body.
    const timerID = setTimeout(() => setNow(Date.now()), Math.max(0, endsAt - Date.now()))
    return () => clearTimeout(timerID)
  }, [endsAt])

  const isLive = !!round && endsAt > now

  return {
    round: isLive ? round : null,
    result: isLive ? result : null,
  }
}
