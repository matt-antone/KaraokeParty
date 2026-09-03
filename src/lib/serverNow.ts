/**
 * The server's clock, read on this machine.
 *
 * A trivia round is a sequence of deadlines — answering closes, the answer
 * gives way to the standings, the round ends — and every one of them is an
 * epoch stamped by the server. The screens reading them are a TV box and a
 * pocketful of phones, none of which agree with the server or each other to
 * better than a few seconds, and some of which are minutes out. Compared
 * naively, a machine running fast walks straight past a three-second beat and
 * shows the room nothing.
 *
 * The correction is the difference between the two clocks, measured once per
 * payload from the moment it was sent. It is cached per payload object rather
 * than kept as a rolling estimate: each one arrives with a fresh stamp, so
 * later payloads correct for drift on their own.
 */

interface Stamped {
  /** Epoch ms this payload left the server, by the server's clock. */
  sentAt: number
}

const offsets = new WeakMap<Stamped, number>()

/**
 * `now` is passed in rather than read here so the caller's tick — useNow — is
 * what drives the re-render, and this stays a pure function of it.
 */
export default function serverNow (payload: Stamped, now: number): number {
  let offset = offsets.get(payload)

  if (offset === undefined) {
    // measured on first sight, which is within a render of arrival; the
    // one-way network delay it also absorbs is a LAN hop
    offset = Date.now() - payload.sentAt
    offsets.set(payload, offset)
  }

  return now - offset
}
