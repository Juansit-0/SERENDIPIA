import { describe, expect, it } from 'vitest'
import { diatonicChords, scalePcs } from './scales'

describe('scales', () => {
  it('computes scale pitch classes', () => {
    expect(scalePcs(0, 'major')).toEqual([0, 2, 4, 5, 7, 9, 11])
    expect(scalePcs(9, 'minor')).toEqual([9, 11, 0, 2, 4, 5, 7])
  })

  it('harmonizes C major', () => {
    const chords = diatonicChords(0, 'major')
    expect(chords.map((chord) => chord.anglo)).toEqual(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'])
    expect(chords.map((chord) => chord.roman)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'])
  })

  it('harmonizes A minor', () => {
    const chords = diatonicChords(9, 'minor')
    expect(chords.map((chord) => chord.anglo)).toEqual(['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G'])
  })

  it('spells F# in G major sevenths', () => {
    const chords = diatonicChords(7, 'major', true)
    expect(chords[0].anglo).toBe('Gmaj7')
    expect(chords[6].anglo).toBe('F#m7b5')
  })

  it('spells flats correctly in Bb and F major', () => {
    expect(diatonicChords(10, 'major').map((chord) => chord.anglo)).toEqual([
      'Bb',
      'Cm',
      'Dm',
      'Eb',
      'F',
      'Gm',
      'Adim',
    ])
    expect(diatonicChords(5, 'major')[3].anglo).toBe('Bb')
  })
})
