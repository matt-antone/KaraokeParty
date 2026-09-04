/**
 * The trivia mark: four VU registers, one per answer colour, level-checking in
 * a four-beat and settling behind a silkscreened nameplate.
 *
 * Every frame is a pure function of elapsed milliseconds, so the resting mark
 * IS the sting's last frame — a still is `mode: 'still'`, which seeks to the
 * end and draws once. There is one drawing routine and one set of numbers, so
 * the card on the TV and the glyph in a queue row cannot drift apart.
 *
 * Framework-free on purpose, like threadField — it owns a canvas, nothing
 * else. The palette is read off the element so variables.css stays the source
 * of truth.
 */

/** Fraction of a register above which a lit segment takes its -hi stop.
 *  Positional, exactly as segments.ts does it: where a segment sits decides
 *  its colour, not how far the bar has travelled. */
const HOT_FROM = 0.55

/** Every timing below is authored against this. A caller asking for a
 *  different duration stretches the same choreography rather than cutting it. */
const REFERENCE_MS = 2500

/** The resting silhouette, as a fraction of the register. Every bar tops out
 *  above the nameplate, so the four heights stay readable. */
const REST = [0.62, 0.94, 0.48, 0.78]
/** Where each bar overshoots to before it settles. */
const PEAK = [0.88, 1, 0.72, 0.95]
/** The four-beat: when each register starts to fill. */
const START = [160, 300, 440, 580]
const RISE = 240
const SETTLE = 300
/** The nameplate wipes across, then TRIVIA arrives a glyph at a time. */
const PLATE = [1150, 1400]
const WORD_FROM = 1400
const WORD_STEP = 70

/** Once the sting has settled the registers keep level-checking for as long as
 *  the card is up. The mark holds the stage for a whole handover, which is
 *  rarely 2.5s, and a meter frozen mid-reading reads as a broken screen.
 *
 *  Two sines per register at rates that share no period, so there is no seam
 *  to hide: the drift never repeats visibly and never restarts. Amplitude eases
 *  in from nothing, which is what keeps the still frame at REFERENCE_MS exactly
 *  the resting silhouette. */
const IDLE_IN = 900
const IDLE_AMP = 0.06
/** rad/ms, one per register — deliberately not multiples of each other. */
const IDLE_RATE = [0.0013, 0.0017, 0.0011, 0.0019]

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const span = (t: number, from: number, to: number) => clamp01((t - from) / (to - from))
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const outQuint = (t: number) => 1 - Math.pow(1 - t, 5)

interface Palette {
  bg: string
  well: string
  ink: string
  off: string
  vu: string
  ans: Array<[string, string]>
}

function palette (cv: HTMLCanvasElement): Palette {
  const s = getComputedStyle(cv)
  const v = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback

  return {
    bg: v('--chassis-deep', '#0d0e0f'),
    well: v('--key-well', '#17181a'),
    ink: v('--ink', '#e6e4de'),
    off: v('--ink-5', '#4c5055'),
    vu: v('--vu', '#ff8a1e'),
    ans: [
      [v('--ans-1-lo', '#a12129'), v('--ans-1-hi', '#ba2630')],
      [v('--ans-2-lo', '#195834'), v('--ans-2-hi', '#1f6f42')],
      [v('--ans-3-lo', '#324eac'), v('--ans-3-hi', '#3959c4')],
      [v('--ans-4-lo', '#81308e'), v('--ans-4-hi', '#9638a4')],
    ],
  }
}

/** Michroma tracked .13em, the wordmark's own setting. Drawn a glyph at a time
 *  so the tracking is ours and the reveal can be per-letter. */
const setFace = (ctx: CanvasRenderingContext2D, size: number) => {
  ctx.font = `400 ${size}px Michroma, 'Arial Narrow', sans-serif`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
}

function trackedWidth (ctx: CanvasRenderingContext2D, text: string, size: number, tracking: number) {
  let w = 0
  for (const ch of text) w += ctx.measureText(ch).width + tracking * size
  return w - tracking * size
}

function drawTracked (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  tracking: number,
  count: number,
) {
  let cx = x
  const chars = Array.from(text)

  for (let i = 0; i < chars.length && i < count; i++) {
    ctx.fillText(chars[i], cx, y)
    cx += ctx.measureText(chars[i]).width + tracking * size
  }
}

/** A segment face: flat, with the bevel's 1px top highlight and bottom shade.
 *  Under 4px tall the bevel is noise, so it is dropped. */
function face (
  ctx: CanvasRenderingContext2D,
  fx: number, fy: number, fw: number, fh: number,
  fill: string,
  isLit: boolean,
) {
  const x = Math.round(fx)
  const y = Math.round(fy)
  const w = Math.max(1, Math.round(fw))
  const h = Math.max(1, Math.round(fh))

  ctx.fillStyle = fill
  ctx.fillRect(x, y, w, h)
  if (h < 4) return

  ctx.fillStyle = isLit ? 'rgba(255,255,255,.16)' : 'rgba(0,0,0,.55)'
  ctx.fillRect(x, y, w, 1)

  if (isLit) {
    ctx.fillStyle = 'rgba(0,0,0,.4)'
    ctx.fillRect(x, y + h - 1, w, 1)
  }
}

/** How high register `i` stands at authored time `t`: up to its peak, then
 *  settled to its resting height. */
function level (i: number, t: number) {
  const s = START[i]
  if (t < s) return 0

  const rise = span(t, s, s + RISE)
  if (rise < 1) return PEAK[i] * outQuint(rise)

  const settled = lerp(PEAK[i], REST[i], outCubic(span(t, s + RISE, s + RISE + SETTLE)))
  return clamp01(settled + drift(i, t))
}

/** The idle wander, zero until the sting is over. */
function drift (i: number, t: number) {
  const amp = IDLE_AMP * clamp01((t - REFERENCE_MS) / IDLE_IN)
  if (amp <= 0) return 0

  const p = t - REFERENCE_MS
  const r = IDLE_RATE[i]
  return amp * (Math.sin(p * r) * 0.6 + Math.sin(p * r * 0.37 + i) * 0.4)
}

/** The peak-hold marker: rides the bar up, holds at the peak, then drops onto
 *  it and goes out. Null once it has nothing left to say. */
function peakHold (i: number, t: number) {
  const s = START[i]
  if (t < s) return null

  const hold = s + RISE + 520
  const alpha = 1 - span(t, hold + 260, hold + 360)
  if (alpha <= 0) return null

  const at = t < hold
    ? PEAK[i] * outQuint(span(t, s, s + RISE))
    : lerp(PEAK[i], REST[i], outCubic(span(t, hold, hold + 320)))

  return { at, alpha }
}

export interface TriviaStingOptions {
  /** 'still' draws the resting frame once and never animates — what every
   *  small placement wants. */
  mode?: 'sting' | 'still'
  /** Drops the nameplate and the word: the registers alone, for sizes where
   *  Michroma at .13em would be a smudge. */
  glyph?: boolean
  /** Stretches the same choreography. Defaults to 2500. */
  durationMs?: number
  /** Segments per register. 14 on a stage, 5 in a glyph. */
  segments?: number
  /** A spent round: drawn in --ink-5 instead of the answer colours, because
   *  the deck dims by colour and never by opacity. */
  isDim?: boolean
}

export interface TriviaSting {
  play (): void
  replay (): void
  /** Jump to an authored millisecond and hold there. */
  seek (ms: number): void
  /** The resting mark. */
  hold (): void
  stop (): void
  /** Cancels the loop, drops the observer and releases the backing store. */
  destroy (): void
}

export default function createTriviaSting (
  cv: HTMLCanvasElement,
  opts: TriviaStingOptions = {},
): TriviaSting {
  const isGlyph = !!opts.glyph
  const isStill = opts.mode === 'still' || isGlyph
  const ctx = cv.getContext('2d', { alpha: isGlyph })

  if (!ctx) {
    return { play () {}, replay () {}, seek () {}, hold () {}, stop () {}, destroy () {} }
  }

  const P = palette(cv)
  const DPR = Math.min(2, window.devicePixelRatio || 1)
  const SEG = opts.segments ?? (isGlyph ? 5 : 14)
  const DUR = opts.durationMs ?? REFERENCE_MS

  let W = 1
  let H = 1
  let req: number | null = null
  let t = isStill ? DUR : 0
  let startedAt = 0

  function frame (at: number) {
    if (isGlyph) ctx.clearRect(0, 0, W, H)
    else {
      ctx.fillStyle = P.bg
      ctx.fillRect(0, 0, W, H)
    }

    // authored time: a caller's duration stretches the timeline, never trims it.
    // Unclamped, because past REFERENCE_MS the idle drift is the timeline — the
    // plate wipe and the word saturate on their own.
    const a = at * (REFERENCE_MS / DUR)

    const markW = isGlyph ? W : Math.min(W * 0.6, H * 1.16)
    const markH = isGlyph ? H : markW / 1.42
    const cx = W / 2
    const x0 = cx - markW / 2
    const y0 = H / 2 - markH / 2

    const barW = markW / (4 + 3 * 0.26)
    const gapX = barW * 0.26
    const seam = Math.max(isGlyph ? 1 : 2, Math.round((isGlyph ? 1 : 2.5) * DPR))
    const segH = (markH - (SEG - 1) * seam) / SEG

    for (let i = 0; i < 4; i++) {
      const bx = x0 + i * (barW + gapX)
      const raw = level(i, a) * SEG
      const lit = Math.floor(raw)
      const partial = raw - lit

      for (let s = 0; s < SEG; s++) {
        const sy = y0 + markH - (s + 1) * segH - s * seam
        const isLit = s < lit
        const stop = s / SEG >= HOT_FROM ? 1 : 0
        const on = opts.isDim ? P.off : P.ans[i][stop]

        face(ctx, bx, sy, barW, segH, isLit ? on : P.well, isLit)

        // The segment the bar is standing in, lit by how far into it the level
        // has actually travelled. Without it the bar can only be at one of SEG
        // heights, so every rise is a ladder of pops rather than a movement.
        if (s === lit && partial > 0.02) {
          ctx.globalAlpha = partial
          face(ctx, bx, sy, barW, segH, on, true)
          ctx.globalAlpha = 1
        }
      }

      const pk = peakHold(i, a)
      if (pk && pk.at > 0.02 && !opts.isDim) {
        ctx.globalAlpha = pk.alpha
        ctx.fillStyle = P.vu
        ctx.fillRect(
          Math.round(bx),
          Math.round(y0 + markH - pk.at * markH),
          Math.round(barW),
          Math.max(1, Math.round(2 * DPR)),
        )
        ctx.globalAlpha = 1
      }
    }

    if (isGlyph) return

    // the nameplate: a graphite band engraved across the registers, low enough
    // that all four tops stay above it
    const wipe = outCubic(span(a, PLATE[0], PLATE[1]))
    if (wipe <= 0) return

    const plateH = markH * 0.26
    const plateCy = y0 + markH * 0.74
    const plateY = Math.round(plateCy - plateH / 2)
    const plateX = Math.round(cx - (markW * 1.1) / 2)

    ctx.fillStyle = P.bg
    ctx.fillRect(plateX, plateY, Math.round(markW * 1.1 * wipe), Math.round(plateH))
    ctx.fillStyle = 'rgba(74,78,84,.5)'
    ctx.fillRect(plateX, plateY, Math.round(markW * 1.1 * wipe), 1)
    ctx.fillRect(plateX, plateY + Math.round(plateH) - 1, Math.round(markW * 1.1 * wipe), 1)

    const shown = Math.max(0, Math.min(6, Math.floor((a - WORD_FROM) / WORD_STEP)))
    if (!shown) return

    const size = plateH * 0.42
    setFace(ctx, size)
    ctx.fillStyle = opts.isDim ? P.off : P.ink
    drawTracked(ctx, 'TRIVIA', cx - trackedWidth(ctx, 'TRIVIA', size, 0.13) / 2, plateCy, size, 0.13, shown)
  }

  function size () {
    const r = cv.getBoundingClientRect()
    W = cv.width = Math.max(1, Math.round(r.width * DPR))
    H = cv.height = Math.max(1, Math.round(r.height * DPR))
    frame(t)
  }

  // No terminal frame: after DUR the registers go on level-checking, so the
  // loop runs until destroy(). rAF is already parked while the tab is hidden.
  function loop (now: number) {
    t = now - startedAt
    frame(t)
    req = requestAnimationFrame(loop)
  }

  function stop () {
    if (req !== null) cancelAnimationFrame(req)
    req = null
  }

  const api: TriviaSting = {
    play () {
      // reduced motion gets the resting mark, never a slower sting
      if (isStill || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        api.hold()
        return
      }

      stop()
      startedAt = performance.now() - t
      req = requestAnimationFrame(loop)
    },
    replay () {
      t = 0
      api.play()
    },
    seek (ms: number) {
      stop()
      t = Math.max(0, ms)
      frame(t)
    },
    hold () {
      api.seek(DUR)
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
