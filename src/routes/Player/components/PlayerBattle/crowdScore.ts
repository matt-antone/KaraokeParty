import { BATTLE_SCORE_MAX, clampBattleScore } from 'shared/types'

/**
 * Turning "how loud was the room" into a number, with no DOM in sight.
 *
 * Split out of useCrowdMic so it can be tested at all: happy-dom has no Web
 * Audio, so anything that touches an AnalyserNode is untestable in this repo,
 * and this is the half where being wrong is invisible until a battle is
 * decided by it.
 */

/** Quietest RMS worth a segment, in dBFS. A room with nobody shouting still
 *  reads around here on a laptop's own microphone — this is the bottom of the
 *  scale, not silence. */
const FLOOR_DB = -60

/** Top of the scale. A cheering room a few metres from a built-in microphone
 *  lands well short of 0 dBFS, and a meter that runs all the way to 0 spends
 *  its top third unused: the fullest room of the night would light two thirds
 *  of the bar and read as a disappointment. */
const CEIL_DB = -6

/** What fraction of the beat's frames the grade is taken from — the loudest
 *  ones. Scoring on the peak lets one cough or a knocked stand win a battle;
 *  scoring on the mean of everything lets the gaps between chants drag a loud
 *  room down to the same number as a quiet one. The loudest quarter is "how
 *  loud did this room get, for long enough to count". */
const LOUDEST_FRACTION = 0.25

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/**
 * One analyser frame to a 0-1 level, by RMS on a dB scale.
 *
 * The dB step is the whole reason this function exists. Linear RMS from a real
 * room sits between about 0.01 and 0.1, so feeding it straight to a 24-segment
 * meter lights two segments when the room is screaming and the display reads
 * as broken hardware. Hearing is logarithmic and so is the bar.
 */
export function frameLevel (samples: ArrayLike<number>): number {
  if (!samples.length) return 0

  let sum = 0
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i]

  const rms = Math.sqrt(sum / samples.length)
  if (rms <= 0) return 0

  const db = 20 * Math.log10(rms)
  return clamp01((db - FLOOR_DB) / (CEIL_DB - FLOOR_DB))
}

/**
 * Every level captured across a metering beat, reduced to a grade out of
 * BATTLE_SCORE_MAX.
 *
 * ponytail: the grade is a comparison between the two fighters and nothing
 * else. The microphone's own gain, where the laptop is sitting and whatever
 * automatic gain control the browser refused to switch off all move it, so the
 * absolute number is meaningless — it is only fair because both fighters are
 * measured through the same microphone within thirty seconds of each other. If
 * that ever needs to be an absolute reading, it needs a calibration pass
 * against a known level, not a different formula here.
 */
export function gradeFromLevels (levels: ArrayLike<number>): number {
  if (!levels.length) return 0

  const sorted = Array.from(levels).filter(Number.isFinite).sort((a, b) => b - a)
  if (!sorted.length) return 0

  const take = Math.max(1, Math.ceil(sorted.length * LOUDEST_FRACTION))
  let sum = 0
  for (let i = 0; i < take; i++) sum += sorted[i]

  return clampBattleScore((sum / take) * BATTLE_SCORE_MAX)
}
