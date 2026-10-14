import { describe, expect, it } from 'vitest'
import { beatsToNotation, isAccentBeat, progressionTicks, stepDurationSeconds } from './timing'

describe('beatsToNotation', () => {
  it('maps beats per chord to transport notation', () => {
    expect(beatsToNotation(1)).toBe('4n')
    expect(beatsToNotation(2)).toBe('2n')
    expect(beatsToNotation(4)).toBe('1m')
    expect(beatsToNotation(8)).toBe('2m')
  })

  it('spells odd lengths as bars:beats:sixteenths', () => {
    expect(beatsToNotation(3)).toBe('0:3:0')
    expect(beatsToNotation(6)).toBe('1:2:0')
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
    expect(stepDurationSeconds(0, 4)).toBe(0)
  })
})

describe('progressionTicks', () => {
  it('counts every beat of every chord', () => {
    expect(progressionTicks(4, 4, 192)).toBe(3072)
    expect(progressionTicks(4, 8, 192)).toBe(6144)
    expect(progressionTicks(3, 1, 192)).toBe(576)
  })

  it('never returns an empty cycle', () => {
    expect(progressionTicks(0, 4, 192)).toBe(768)
  })
})

describe('tap tempo', () => {
  it('reads the tempo from the median gap and ignores one stray tap', async () => {
    const { tapTempo } = await import('./timing')
    expect(tapTempo([0])).toBeNull()
    expect(tapTempo([0, 500, 1000, 1500])).toBe(120)
    expect(tapTempo([0, 500, 1000, 1700, 2200, 2700])).toBe(120)
  })

  it('starts over after a pause and stays in range', async () => {
    const { tapTempo } = await import('./timing')
    expect(tapTempo([0, 500, 5000, 5600])).toBe(100)
    expect(tapTempo([0, 100])).toBe(208)
    expect(tapTempo([0, 1900])).toBe(40)
  })

  it('subdivides a beat', async () => {
    const { subdivisionOffsets } = await import('./timing')
    expect(subdivisionOffsets(1)).toEqual([])
    expect(subdivisionOffsets(2)).toEqual([0.5])
    expect(subdivisionOffsets(3).map((x) => +x.toFixed(3))).toEqual([0.333, 0.667])
  })
})
