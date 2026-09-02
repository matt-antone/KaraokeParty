/** Fraction of the scale above which a lit segment reads as amber, not dim. */
const HOT_FROM = 0.55

export type SegmentState = 'off' | 'dim' | 'hot' | 'peak'

/** Values arrive from live sources, so clamp rather than trusting the range. */
export const clampValue = (value: number) =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0

/**
 * Which state segment `i` takes. Colour is positional: where a segment sits on
 * the scale decides it, not the value — so the strip reads as a calibrated
 * register that fills, rather than a bar that changes colour as it grows.
 */
export function segmentState (
  i: number,
  segments: number,
  value: number,
  peakFrom: number,
): SegmentState {
  if (i >= Math.round(clampValue(value) * segments)) return 'off'
  const at = i / segments
  if (at >= peakFrom) return 'peak'
  return at >= HOT_FROM ? 'hot' : 'dim'
}
