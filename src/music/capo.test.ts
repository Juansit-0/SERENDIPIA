import { describe, expect, it } from 'vitest'
import { clampCapo, shapeChord, soundingChord, transposeChord, withCapo } from './capo'
import { parseChord } from './parseChord'

const chord = (symbol: string) => parseChord(symbol)!

describe('clampCapo', () => {
  it('clamps into 0..7', () => {
    expect(clampCapo(-3)).toBe(0)
    expect(clampCapo(0)).toBe(0)
    expect(clampCapo(3.4)).toBe(3)
    expect(clampCapo(9)).toBe(7)
    expect(clampCapo(Number.NaN)).toBe(0)
  })
})

describe('withCapo', () => {
  it('returns the same tuning at capo 0', () => {
    expect(withCapo([40, 45, 50, 55, 59, 64], 0)).toEqual([40, 45, 50, 55, 59, 64])
  })

  it('raises every string by the capo', () => {
    expect(withCapo([40, 45, 50, 55, 59, 64], 2)).toEqual([42, 47, 52, 57, 61, 66])
  })
})

describe('transposeChord', () => {
  it('keeps the shape name at capo 0', () => {
    const a = chord('A')
    expect(soundingChord(a, 0).anglo).toBe('A')
  })

  it('sounds the shape transposed up by the capo', () => {
    expect(soundingChord(chord('A'), 2).anglo).toBe('B')
    expect(soundingChord(chord('Am7'), 2).anglo).toBe('Bm7')
    expect(soundingChord(chord('E'), 1).anglo).toBe('F')
  })

  it('spells the sounding chord with the right accidentals', () => {
    expect(soundingChord(chord('C'), 1).anglo).toBe('Db')
    expect(soundingChord(chord('C'), 1).latin).toBe('Reb')
    expect(soundingChord(chord('G'), 2).anglo).toBe('A')
    expect(soundingChord(chord('Bb'), 2).anglo).toBe('C')
  })

  it('transposes a slash bass', () => {
    const sounded = soundingChord(chord('Cmaj7/G'), 2)
    expect(sounded.anglo).toBe('Dmaj7/A')
    expect(sounded.bassPc).toBe(9)
  })

  it('inverts back to the shape', () => {
    const shape = chord('F#m7b5')
    const sounded = soundingChord(shape, 4)
    const back = shapeChord(sounded, 4)
    expect(back.anglo).toBe(shape.anglo)
    expect(back.rootPc).toBe(shape.rootPc)
  })

  it('transposes by negative semitones without leaving 0..11', () => {
    const shifted = transposeChord(chord('C'), -2)
    expect(shifted.anglo).toBe('Bb')
    expect(shifted.rootPc).toBe(10)
  })
})
