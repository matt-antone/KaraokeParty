/**
 * The two stings the stage reaches for, and the one element per file that
 * plays them.
 *
 * Trivia found these first and a battle wants exactly the same two sounds for
 * exactly the same reason — a room needs to hear whether it did well before it
 * has finished reading why. Keeping one copy means the second screen cannot
 * drift onto a different applause, and means the autoplay rules below are
 * learned once rather than rediscovered.
 *
 * Not to be confused with lib/alertCue, which synthesises a short blip through
 * WebAudio to get a guest's attention. These are recordings, played at the
 * room.
 */

/** Served straight off the assets folder, the way index.html takes its icons —
 *  a sound played once needs no bundling. */
export const CHEER = 'assets/audience-applause.mp3'
export const GROAN = 'assets/losing-horns-1.mp3'

/** One element per file, kept for the night. Built on demand rather than at
 *  module scope: this module is imported by tests that render without a DOM,
 *  where Audio does not exist. */
const cues = new Map<string, HTMLAudioElement>()

export function soundCue (src: string): HTMLAudioElement {
  let audio = cues.get(src)

  if (!audio) {
    audio = new Audio(src)
    audio.preload = 'auto'
    cues.set(src, audio)
  }

  return audio
}

/** Rewind and play, best-effort, never caring whether it worked.
 *
 *  The rewind is the part worth having in one place: the element is kept for
 *  the night, so the second time a sting is asked for it is sitting at the end
 *  of itself and plays nothing at all.
 *
 *  And the swallowed rejection is not laziness. A browser that has not been
 *  touched since the page loaded refuses to make noise, and the stage on a TV
 *  box is very often exactly that — so a cue that does not fire is an ordinary
 *  Tuesday rather than an error, and nothing may be built to depend on it. */
export function playCue (src: string): void {
  const audio = soundCue(src)
  audio.currentTime = 0
  void audio.play().catch(() => {})
}
