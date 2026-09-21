import { describe, expect, it } from 'vitest'
import { QUALITY_LIST, chordTones, essentialTones, qualityById, qualityFromSuffix } from './chords'

describe('qualities', () => {
  it('has unique suffixes', () => {
    const suffixes = QUALITY_LIST.map((q) => q.suffix)
    expect(new Set(suffixes).size).toBe(suffixes.length)
  })

  it('resolves aliases with case sensitivity', () => {
    expect(qualityFromSuffix('M')?.id).toBe('maj')
    expect(qualityFromSuffix('m')?.id).toBe('min')
    expect(qualityFromSuffix('M7')?.id).toBe('maj7')
    expect(qualityFromSuffix('m7')?.id).toBe('m7')
    expect(qualityFromSuffix('min')?.id).toBe('min')
    expect(qualityFromSuffix('ø')?.id).toBe('m7b5')
    expect(qualityFromSuffix('')?.id).toBe('maj')
    expect(qualityFromSuffix('xyz')).toBeNull()
  })

  it('computes chord tones', () => {
    expect(chordTones(0, qualityById('maj7'))).toEqual([0, 4, 7, 11])
    expect(chordTones(9, qualityById('m7'))).toEqual([9, 0, 4, 7])
    expect(essentialTones(0, qualityById('add9'))).toEqual([4, 2])
  })
})
