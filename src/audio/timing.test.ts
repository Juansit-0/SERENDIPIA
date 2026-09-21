import { describe, expect, it } from 'vitest'
import { beatsToNotation, stepDurationSeconds } from './timing'

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

describe('stepDurationSeconds', () => {
  it('scales with tempo so live tempo changes hold the same notation', () => {
    expect(stepDurationSeconds(60, 4)).toBeCloseTo(4)
    expect(stepDurationSeconds(120, 4)).toBeCloseTo(2)
    expect(stepDurationSeconds(92, 2)).toBeCloseTo(1.3043, 3)
  })
})
