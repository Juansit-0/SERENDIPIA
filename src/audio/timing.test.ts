import { describe, expect, it } from 'vitest'
import { beatsToNotation, isAccentBeat, stepDurationSeconds } from './timing'

describe('beatsToNotation', () => {
  it('maps beats per chord to transport notation', () => {
    expect(beatsToNotation(1)).toBe('4n')
    expect(beatsToNotation(2)).toBe('2n')
    expect(beatsToNotation(4)).toBe('1m')
    expect(beatsToNotation(8)).toBe('2m')
  })

  it('clamps degenerate values into a musical step', () => {
    expect(beatsToNotation(0)).toBe('4n')
    expect(beatsToNotation(16)).toBe('2m')
  })
})

describe('isAccentBeat', () => {
  it('accents the first beat of every 4/4 bar', () => {
    expect(isAccentBeat(0)).toBe(true)
    expect(isAccentBeat(1)).toBe(false)
    expect(isAccentBeat(2)).toBe(false)
    expect(isAccentBeat(3)).toBe(false)
    expect(isAccentBeat(4)).toBe(true)
    expect(isAccentBeat(7)).toBe(false)
    expect(isAccentBeat(12)).toBe(true)
  })
})

describe('stepDurationSeconds', () => {
  it('scales with tempo so live tempo changes hold the same notation', () => {
    expect(stepDurationSeconds(60, 4)).toBeCloseTo(4)
    expect(stepDurationSeconds(120, 4)).toBeCloseTo(2)
    expect(stepDurationSeconds(92, 2)).toBeCloseTo(1.3043, 3)
  })
})
