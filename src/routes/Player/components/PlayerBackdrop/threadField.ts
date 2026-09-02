/**
 * The player stage's thread field: six lanes of luminous amber threads, drifting
 * and breathing, pinched to a fan at both edges and dimmer with depth. Each lane
 * is a wide dim glow pass plus a thin bright core, added together.
 *
 * Framework-free on purpose — it owns a canvas, nothing else.
 */

/** Lane centres, top to bottom. The gap from .31 to .70 is deliberate: the
 *  singer's name and the countdown numeral sit there and a thread through a
 *  Michroma glyph is unreadable. */
const LANES = [0.09, 0.2, 0.31, 0.7, 0.83, 0.94]
/** 30fps is plenty for a background, and this runs all night on a room's TV box. */
const FRAME_MS = 33

const rgb = (style: CSSStyleDeclaration, name: string) => {
  const n = parseInt(style.getPropertyValue(name).trim().slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

interface ThreadField {
  /** Cancels the loop, drops the observer and releases the canvas' backing store. */
  stop(): void
}

export default function createThreadField (cv: HTMLCanvasElement): ThreadField {
  const ctx = cv.getContext('2d', { alpha: false })
  if (!ctx) return { stop () {} }

  // the palette lives in variables.css; read it off the element rather than
  // duplicating hex here. Amber ramp only.
  const style = getComputedStyle(cv)
  const BG = style.getPropertyValue('--chassis-deep').trim() || '#0d0e0f'
  const vu = rgb(style, '--vu')
  const AMBER = [
    vu.join(','),
    // a warm highlight, taken off the signal rather than introducing a hue
    vu.map(c => Math.round(c + (255 - c) * 0.4)).join(','),
    rgb(style, '--vu-dim').join(','),
  ]

  const DPR = Math.min(1.5, window.devicePixelRatio || 1)
  const N = LANES.length
  let W = 1
  let H = 1
  let req: number | null = null
  let last = 0

  const bundles = LANES.map((y, i) => {
    const depth = i / (N - 1) // 0 near, 1 far
    return {
      depth,
      y,
      amp: 0.1 - 0.05 * depth,
      k: 1.1 + 1.7 * depth, // waves across the frame
      speed: (0.5 + 0.9 * (1 - depth)) * (i % 2 ? 1 : -1),
      breath: 0.00028 + 0.0004 * depth,
      phase: i * 1.7,
      color: AMBER[i % 3],
      strands: 2,
    }
  })

  function draw (t: number) {
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, W, H)
    ctx.globalCompositeOperation = 'lighter'
    ctx.lineCap = 'round'

    for (const b of bundles) {
      const near = 1 - b.depth
      const breathe = 0.66 + 0.34 * Math.sin(t * b.breath + b.phase)

      for (let s = 0; s < b.strands; s++) {
        const off = (s - (b.strands - 1) / 2) * 0.022 * (1.4 - b.depth)
        const steps = 24
        ctx.beginPath()

        for (let i = 0; i <= steps; i++) {
          const x = i / steps
          const wave = Math.sin(b.k * Math.PI * 2 * x + t * 0.0006 * b.speed + b.phase + s * 0.55)
          // pinched at both edges, so each bundle reads as a fan rather than a band
          const fan = 0.3 + 0.7 * Math.sin(Math.PI * x)
          const y = b.y + off + b.amp * breathe * wave * fan
          if (i) ctx.lineTo(x * W, y * H)
          else ctx.moveTo(x * W, y * H)
        }

        ctx.strokeStyle = `rgba(${b.color},${(0.03 + 0.035 * near).toFixed(3)})`
        ctx.lineWidth = (7 - 3 * b.depth) * DPR
        ctx.stroke()
        ctx.strokeStyle = `rgba(${b.color},${(0.14 + 0.2 * near).toFixed(3)})`
        ctx.lineWidth = (0.9 + 0.9 * near) * DPR
        ctx.stroke()
      }
    }

    ctx.globalCompositeOperation = 'source-over'
  }

  function size () {
    const r = cv.getBoundingClientRect()
    W = cv.width = Math.max(1, Math.round(r.width * DPR))
    H = cv.height = Math.max(1, Math.round(r.height * DPR))
    draw(last)
  }

  function loop (t: number) {
    req = requestAnimationFrame(loop)
    if (t - last < FRAME_MS) return
    last = t
    draw(t)
  }

  const ro = new ResizeObserver(size)
  ro.observe(cv)
  size()

  // reduced motion gets the one static frame size() just drew, never a slower one
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    req = requestAnimationFrame(loop)
  }

  return {
    stop () {
      if (req !== null) cancelAnimationFrame(req)
      req = null
      ro.disconnect()
      // drop the backing store rather than sit on a full-frame bitmap all night
      cv.width = cv.height = 1
    },
  }
}
