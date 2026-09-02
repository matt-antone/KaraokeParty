import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * DECK's palette is closed and every pairing below is load-bearing: the whole
 * system says "on is amber, off is dim graphite", so text lands on a small,
 * known set of surfaces. This asserts each of those pairings clears WCAG AA.
 *
 * It exists because two of them did not. Ink on --vu measured 1.85:1 and ink on
 * a filled --alert key measured 2.65:1; both shipped in the first token pass and
 * were invisible until measured. Reading the real variables.css rather than a
 * copy of the values is the point — edit a colour and this fails.
 */

const AA_NORMAL = 4.5 // < 18.66px bold
const AA_LARGE = 3.0 // >= 18.66px bold, and non-text UI boundaries

const css = readFileSync(join(__dirname, 'variables.css'), 'utf8')

function token (name: string): string {
  const m = css.match(new RegExp(`^\\s*--${name}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`, 'm'))
  if (!m) throw new Error(`--${name} is not a literal hex in variables.css`)
  return m[1]
}

function luminance (hex: string): number {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast (fg: string, bg: string): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
  return (hi + 0.05) / (lo + 0.05)
}

describe('DECK palette contrast', () => {
  // [label, foreground token, background token, threshold]
  const pairs: Array<[string, string, string, number]> = [
    ['body ink on the chassis', 'ink', 'chassis', AA_NORMAL],
    ['body ink on a panel', 'ink', 'faceplate', AA_NORMAL],
    ['secondary ink on a panel', 'ink-2', 'faceplate', AA_NORMAL],
    ['meta ink on a panel', 'ink-3', 'faceplate', AA_NORMAL],
    ['ink on a graphite key', 'ink', 'key', AA_NORMAL],
    ['placeholder in a field well', 'ink-3', 'key-well', AA_NORMAL],
    ['amber as a label on the chassis', 'vu', 'chassis', AA_NORMAL],
    ['amber as a label on a panel', 'vu', 'faceplate', AA_NORMAL],
    // the primary key is filled amber: text on it must be near-black, not ink
    ['on-vu across the amber key face', 'on-vu', 'vu-hi', AA_NORMAL],
    ['on-vu across the amber key face', 'on-vu', 'vu-lo', AA_NORMAL],
    // the destructive key is filled red: --alert itself is too light to carry text
    ['ink across the alert key face', 'ink', 'alert-key-hi', AA_NORMAL],
    ['ink across the alert key face', 'ink', 'alert-key-lo', AA_NORMAL],
    // a fault *label* on graphite is large display type on the player
    ['alert as a label on the chassis', 'alert', 'chassis', AA_LARGE],
    ['teal standby on a panel', 'standby', 'faceplate', AA_NORMAL],
  ]

  it.each(pairs)('%s (%s on %s) clears %f:1', (_label, fg, bg, min) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(min)
  })

  it('spent ink is dim but still legible on the chassis', () => {
    // "already sung" rows dim by colour, never opacity — but a record you can
    // no longer act on is still a record you have to be able to read.
    expect(contrast(token('ink-4'), token('chassis'))).toBeGreaterThanOrEqual(AA_LARGE)
  })

  it('keeps the palette closed: no fifth signal colour', () => {
    const signals = (css.match(/^\s*--(?:vu|standby|alert)[a-z-]*:\s*#/gm) ?? []).length
    // vu ×5, standby ×3, alert ×5 (3 signal + 2 key-face) = 13.
    // If this fails you are adding a signal colour. The design system's answer
    // is that you want a different indicator, not a new hue — decide first,
    // then update this number deliberately.
    //
    // Went 12 → 13 for --standby-dim: no new hue, it is teal's lit-but-low
    // meter step, derived at the same lightness ratio --vu-dim has to --vu, so
    // YourTurn's meter can read in the state's own colour. A fourth HUE would
    // still be wrong; a missing step of an existing indicator was the gap.
    expect(signals).toBe(13)
  })

  it('keeps the QR plate colour in step with --ink', () => {
    // A QR code is painted to a canvas, so its background has to be a real
    // colour rather than var(--ink). These two files are the only place a
    // palette value is written outside variables.css; this is what keeps them
    // honest, and it is cheaper than the DOM-reading effect it replaced.
    const consumers = [
      'routes/Player/components/PlayerQR/PlayerQR.tsx',
      'routes/Settings/components/Player/JoinCode/JoinCode.tsx',
    ]

    for (const file of consumers) {
      const src = readFileSync(join(__dirname, '..', file), 'utf8')
      const m = src.match(/^const INK = '(#[0-9a-fA-F]{3,8})'$/m)
      expect(m, `${file} should declare a literal INK constant`).toBeTruthy()
      expect(m![1].toLowerCase(), file).toBe(token('ink').toLowerCase())
    }
  })
})
