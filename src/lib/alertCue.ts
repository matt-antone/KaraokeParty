/**
 * The "look at your phone" cue.
 *
 * A trivia round opens on a screen nobody is necessarily watching, and the
 * dialog appearing is silent. Three channels fire together because no single
 * one reaches a whole room: vibration is missing on iOS entirely, sound is
 * dead on any iPhone with the ringer switch off, and the flash on the dialog
 * itself (TriviaDialog.css) only lands if they are already looking. All three
 * are best-effort — a phone that can do none of them still gets the dialog.
 */

let ctx: AudioContext | null = null

/**
 * iOS will not let a page make sound until it has been touched, and the
 * context has to be built inside that gesture. Guests have tapped long before
 * trivia starts — signing in, adding a song — so the first tap anywhere buys
 * the cue for the rest of the night.
 */
const unlock = () => {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)()
    void ctx.resume()
  } catch {
    ctx = null // no Web Audio: vibration and the flash carry it
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', unlock, { once: true, capture: true })
}

/** Two rising blips, short enough not to talk over the singer. */
const blip = () => {
  if (!ctx) return

  void ctx.resume() // may have been suspended while backgrounded
  const start = ctx.currentTime

  for (const [i, freq] of [880, 1320].entries()) {
    const at = start + i * 0.12
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.frequency.value = freq
    // ramped rather than switched: a square-edged gate on a phone speaker
    // reads as a click, which is the wrong kind of attention
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.3, at + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.1)

    osc.connect(gain).connect(ctx.destination)
    osc.start(at)
    osc.stop(at + 0.12)
  }
}

export default function alertCue (): void {
  navigator.vibrate?.([80, 60, 80])
  blip()
}
