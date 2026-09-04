import { describe, expect, it } from 'vitest'
import { frameLevel, gradeFromLevels } from './crowdScore'

/**
 * The maths a battle is decided by, tested because nothing else can see it.
 *
 * A crowd grade is measured from a microphone and displayed as a number out of
 * a hundred, which means every kind of wrong here looks plausible on screen: a
 * linear scale reads as a dead meter, a peak-based grade hands the battle to
 * whoever's fighter knocked a mic stand over, and a silent room scoring 40
 * makes the verdict a coin toss. None of those show up in a render test.
 */

/** `n` frames' worth of a steady tone at the given amplitude. */
const tone = (amp: number, n = 512) =>
  Float32Array.from({ length: n }, (_, i) => amp * Math.sin((i / n) * Math.PI * 2 * 8))

describe('frameLevel', () => {
  it('reads digital silence as nothing at all', () => {
    expect(frameLevel(new Float32Array(512))).toBe(0)
    expect(frameLevel(new Float32Array(0))).toBe(0)
  })

  it('reads a room quieter than the floor as nothing', () => {
    // -80dBFS: below FLOOR_DB, and clamped rather than allowed to go negative
    expect(frameLevel(tone(0.0001))).toBe(0)
  })

  it('reads a loud room near the top of the scale', () => {
    expect(frameLevel(tone(0.7))).toBeGreaterThan(0.9)
  })

  it('puts a real room in the usable middle, which a linear scale would not', () => {
    // RMS here is about 0.035 — two segments of twenty-four on a linear meter,
    // which is the bug this mapping exists to prevent.
    const level = frameLevel(tone(0.05))

    expect(level).toBeGreaterThan(0.25)
    expect(level).toBeLessThan(0.75)
  })

  it('rises with the room rather than jumping', () => {
    expect(frameLevel(tone(0.01))).toBeLessThan(frameLevel(tone(0.05)))
    expect(frameLevel(tone(0.05))).toBeLessThan(frameLevel(tone(0.2)))
  })
})

describe('gradeFromLevels', () => {
  it('grades a room that never made a sound as zero', () => {
    expect(gradeFromLevels(new Array(120).fill(0))).toBe(0)
    expect(gradeFromLevels([])).toBe(0)
  })

  it('grades a room that shouted for the whole beat near full marks', () => {
    expect(gradeFromLevels(new Array(120).fill(0.95))).toBeGreaterThan(90)
  })

  it('does not let one spike win a battle', () => {
    // 119 frames of nothing and one frame pinned. A peak-based grade calls
    // this a full house; a knocked microphone stand is exactly this shape.
    const spike = new Array(120).fill(0)
    spike[57] = 1

    expect(gradeFromLevels(spike)).toBeLessThan(5)
  })

  it('ranks a loud room above a quiet one that had one good moment', () => {
    const steady = new Array(120).fill(0.6)
    const oneMoment = new Array(120).fill(0.05)
    for (let i = 0; i < 6; i++) oneMoment[i] = 1

    expect(gradeFromLevels(steady)).toBeGreaterThan(gradeFromLevels(oneMoment))
  })

  it('returns a whole number inside the score range', () => {
    const grade = gradeFromLevels([0.333, 0.777, 0.5, 0.9])

    expect(Number.isInteger(grade)).toBe(true)
    expect(grade).toBeGreaterThanOrEqual(0)
    expect(grade).toBeLessThanOrEqual(100)
  })

  it('survives a NaN frame rather than grading the whole beat NaN', () => {
    // getFloatTimeDomainData on a track that has just ended can hand back
    // garbage, and one bad frame must not void the round.
    expect(gradeFromLevels([0.8, NaN, 0.8, 0.8])).toBeGreaterThan(50)
  })
})
