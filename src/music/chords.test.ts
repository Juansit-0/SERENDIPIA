import { describe, expect, it } from 'vitest'
import { QUALITY_LIST, QualityId, chordToneSpelling, chordTones, essentialTones, qualityById, qualityFromSuffix } from './chords'
import { chordAccidental } from './notes'

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

describe('chordToneSpelling', () => {
  const spell = (rootPc: number, id: QualityId, preferFlat = chordAccidental(rootPc) === 'flat') =>
    chordToneSpelling(rootPc, qualityById(id), preferFlat).map((tone) => tone.anglo)

  it('spells natural-letter roots on their own letter', () => {
    expect(spell(5, 'maj')).toEqual(['F', 'A', 'C'])
    expect(spell(5, 'maj', false)).toEqual(['F', 'A', 'C'])
    expect(spell(11, 'maj', true)).toEqual(['B', 'D#', 'F#'])
    expect(spell(10, 'maj')).toEqual(['Bb', 'D', 'F'])
    expect(spell(3, 'maj')).toEqual(['Eb', 'G', 'Bb'])
  })

  it('spells the flat five as a fifth', () => {
    expect(spell(0, 'dim')).toEqual(['C', 'Eb', 'Gb'])
    expect(spell(11, 'm7b5')).toEqual(['B', 'D', 'F', 'A'])
    expect(spell(7, '7b5')).toEqual(['G', 'B', 'Db', 'F'])
  })

  it('spells the diminished seventh as a seventh', () => {
    expect(spell(0, 'dim7')).toEqual(['C', 'Eb', 'Gb', 'Bbb'])
    expect(spell(11, 'dim7')).toEqual(['B', 'D', 'F', 'Ab'])
  })

  it('keeps sixths as sixths', () => {
    expect(spell(0, '6')).toEqual(['C', 'E', 'G', 'A'])
    expect(spell(9, 'm6')).toEqual(['A', 'C', 'E', 'F#'])
  })
})
