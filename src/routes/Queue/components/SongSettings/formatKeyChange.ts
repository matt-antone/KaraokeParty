/**
 * A key offset as a singer reads it on a remote: signed semitones, with an
 * explicit "+" so a raised key is never mistaken for the original, and a real
 * minus sign rather than a hyphen so the two line up in the mono readout.
 */
export const formatKeyChange = (keyChange: number): string => (
  keyChange === 0 ? '0' : keyChange > 0 ? `+${keyChange}` : `−${Math.abs(keyChange)}`
)
