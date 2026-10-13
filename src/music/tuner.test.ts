import { describe, expect, it } from 'vitest'
import { midiToFreq } from './notes'
import { readTuner, tuneAdvice } from './tuner'

const STANDARD = [40, 45, 50, 55, 59, 64]
const DROP_D = [38, 45, 50, 55, 59, 64]
const detune = (midi: number, cents: number) => midiToFreq(midi) * 2 ** (cents / 1200)

describe('tuner', () => {
  it('finds the string being played and how far off it is', () => {
    const reading = readTuner(detune(45, -12), STANDARD)
    expect(reading.stringIndex).toBe(1)
    expect(reading.midi).toBe(45)
    expect(reading.stringCents).toBe(-12)
    expect(tuneAdvice(reading.stringCents)).toBe('tighten')
  })

  it('a string far below its target still counts against the chosen string', () => {
    // The low E slackened down to D: nearest note is D, but the player is tuning string 6 to E.
    const reading = readTuner(midiToFreq(38), STANDARD, 0)
    expect(reading.midi).toBe(38)
    expect(reading.stringCents).toBe(-200)
    expect(tuneAdvice(reading.stringCents)).toBe('tighten')
  })

  it('follows the tuning: in drop D the low string targets D', () => {
    const reading = readTuner(detune(38, 3), DROP_D)
    expect(reading.stringIndex).toBe(0)
    expect(tuneAdvice(reading.stringCents)).toBe('in-tune')
  })

  it('sharp means loosen', () => {
    expect(tuneAdvice(readTuner(detune(64, 20), STANDARD).stringCents)).toBe('loosen')
  })
})
