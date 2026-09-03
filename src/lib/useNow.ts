import { useEffect, useState } from 'react'

/**
 * The current time, re-read on an interval, for the screens that count down in
 * front of the room. Both of them tick at the same rate and neither shows
 * anything finer than a whole second — a quarter-second interval is what keeps
 * the numeral from lagging the second it names.
 *
 * A hook rather than each countdown keeping its own timer: two copies of this
 * is how they drift apart.
 */
export default function useNow (intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const intervalID = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(intervalID)
  }, [intervalMs])

  return now
}
