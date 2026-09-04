/**
 * The VS slam: two colour wedges driven in from the edges of the stage and the
 * word landing between them.
 *
 * Built in the shape of lib/triviaSting — a canvas, a palette read off the
 * element, one pure `frame(elapsed)` and a ResizeObserver — because the two are
 * the same job and a second way of doing it is a second thing to keep in step.
 * The differences are the two the brief asks for: everything here is quantised
 * to a step so it lands rather than glides, and there is a real last frame to
 * rest on, so reduced motion and every still get `hold()`.
 *
 * It draws the background of the versus beat and nothing else. The portraits,
 * names and songs are DOM on top of it, so the wedges can be a canvas without
 * any text living in a canvas — which would be unreadable to a screen reader
 * and unselectable by the deck's type rules.
 */

/** The step the whole sting is quantised to. Two frames of a 60Hz display: fast
 *  enough to still read as one move, coarse enough that the eye catches the
 *  ladder. This is the arcade tell, and it is the only reason not to ease. */
const STEP = 33

/** Every timing below is authored against this. A caller asking for a
 *  different duration stretches the same choreography rather than cutting it. */
const REFERENCE_MS = 1200

/** The wedges arrive first and alone: the colour is what tells the room a
 *  battle is starting, before it has read a single word. */
const WEDGE_IN = 260

/** The word lands after the wedges have met, not with them. Two things
 *  arriving together read as one thing arriving badly. */
const WORD_AT = 300
const WORD_SLAM = 130

/** How far past the centreline each wedge reaches, as a fraction of the width.
 *  They overlap, so the diagonal seam between them is a hard edge rather than
 *  a gap showing the chassis through. */
const OVERLAP = 0.04

/** The diagonal, as a fraction of the height. A vertical split reads as a
 *  layout; a lean reads as a fight. */
const LEAN = 0.18

/** How much bigger the word is at the moment it starts falling. */
const SLAM_FROM = 2.6

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const span = (t: number, from: number, to: number) => clamp01((t - from) / (to - from))

/** Time, in steps. Nothing in this file reads the clock directly. */
const stepped = (t: number) => Math.floor(t / STEP) * STEP

interface Palette {
  one: [string, string]
  two: [string, string]
  ink: string
}

function palette (cv: HTMLCanvasElement): Palette {
  const s = getComputedStyle(cv)
  const v = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback

  return {
    // the challenger is crimson and the opponent is moss everywhere a battle
    // is drawn — the same two answer-key colours, which already have measured
    // contrast against --ink and more than 60 degrees between them
    one: [v('--ans-1-hi', '#c01723'), v('--ans-1-lo', '#a7141e')],
    two: [v('--ans-2-hi', '#0d7039'), v('--ans-2-lo', '#0b592d')],
    ink: v('--ink', '#e6e4de'),
  }
}

interface VersusStingOptions {
  /** Stretches the same choreography. Defaults to 1200. */
  durationMs?: number
}

interface VersusSting {
  play (): void
  /** The last frame — both wedges home, the word at rest. What a still gets,
   *  and what reduced motion gets instead of a slower slam. */
  hold (): void
  stop (): void
  /** Cancels the loop, drops the observer and releases the backing store. */
  destroy (): void
}

export default function createVersusSting (
  cv: HTMLCanvasElement,
  opts: VersusStingOptions = {},
): VersusSting {
  const ctx = cv.getContext('2d')

  if (!ctx) {
    return { play () {}, hold () {}, stop () {}, destroy () {} }
  }

  const P = palette(cv)
  const DPR = Math.min(2, window.devicePixelRatio || 1)
  const DUR = opts.durationMs ?? REFERENCE_MS

  let W = 1
  let H = 1
  let req: number | null = null
  let t = 0
  let startedAt = 0

  /** One wedge, driven in from its own side. `dir` is -1 for the left one. */
  function wedge (dir: -1 | 1, stops: [string, string], travelled: number) {
    const reach = W * (0.5 + OVERLAP)
    const lean = H * LEAN
    // off-stage entirely at travelled 0, so the first frame is the bare
    // chassis rather than a sliver of colour already showing
    const offset = dir * (1 - travelled) * (reach + lean)

    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, stops[0])
    grad.addColorStop(1, stops[1])
    ctx.fillStyle = grad

    ctx.beginPath()
    if (dir === -1) {
      ctx.moveTo(offset, 0)
      ctx.lineTo(offset + reach - lean, 0)
      ctx.lineTo(offset + reach, H)
      ctx.lineTo(offset, H)
    } else {
      ctx.moveTo(W + offset - reach + lean, 0)
      ctx.lineTo(W + offset, 0)
      ctx.lineTo(W + offset, H)
      ctx.lineTo(W + offset - reach, H)
    }
    ctx.closePath()
    ctx.fill()
  }

  function frame (at: number) {
    ctx.clearRect(0, 0, W, H)

    // authored time: a caller's duration stretches the timeline, never trims it
    const a = stepped(at) * (REFERENCE_MS / DUR)

    // Linear, on purpose. An ease-out here is what makes a slide look like a
    // menu transition; a constant speed that simply stops is what makes it
    // look like something was thrown.
    wedge(-1, P.one, span(a, 0, WEDGE_IN))
    wedge(1, P.two, span(a, 0, WEDGE_IN))

    const landed = span(a, WORD_AT, WORD_AT + WORD_SLAM)
    if (landed <= 0) return

    // The word falls towards the screen and stops dead. Nothing bounces: a
    // bounce is a spring, and there are no springs on a deck.
    const size = Math.min(W, H) * 0.19 * (SLAM_FROM - (SLAM_FROM - 1) * landed)

    ctx.save()
    ctx.font = `400 ${size}px Michroma, 'Arial Narrow', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = P.ink
    ctx.fillText('VS', W / 2, H / 2)
    ctx.restore()
  }

  function size () {
    const r = cv.getBoundingClientRect()
    W = cv.width = Math.max(1, Math.round(r.width * DPR))
    H = cv.height = Math.max(1, Math.round(r.height * DPR))
    frame(t)
  }

  function stop () {
    if (req !== null) cancelAnimationFrame(req)
    req = null
  }

  // There is a last frame here, unlike the trivia mark: once the word has
  // landed nothing moves again, so the loop parks itself rather than burning a
  // rAF for the remaining four and a half seconds of the beat.
  function loop (now: number) {
    t = now - startedAt
    frame(t)
    req = t >= DUR ? null : requestAnimationFrame(loop)
  }

  const api: VersusSting = {
    play () {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        api.hold()
        return
      }

      stop()
      startedAt = performance.now()
      t = 0
      req = requestAnimationFrame(loop)
    },
    hold () {
      stop()
      t = DUR
      frame(t)
    },
    stop,
    destroy () {
      stop()
      ro.disconnect()
      // drop the backing store rather than sit on a full-frame bitmap all night
      cv.width = cv.height = 1
    },
  }

  const ro = new ResizeObserver(size)
  ro.observe(cv)
  size()

  return api
}
