import { describe, expect, it } from 'vitest'
import { chordLabel, formatChord, parseChord } from './parseChord'

describe('parseChord', () => {
  it('parses basic chords', () => {
    const am7 = parseChord('Am7')
    expect(am7).not.toBeNull()
    expect(am7!.rootPc).toBe(9)
    expect(am7!.quality.id).toBe('m7')
    expect(am7!.anglo).toBe('Am7')
    expect(am7!.latin).toBe('La m7')
  })

  it('parses latin input, with and without space', () => {
    expect(parseChord('Dom7')!.rootPc).toBe(0)
    expect(parseChord('Dom7')!.quality.id).toBe('m7')
    expect(parseChord('Do m7')!.rootPc).toBe(0)
    expect(parseChord('Sib')!.rootPc).toBe(10)
    expect(parseChord('Solm')!.rootPc).toBe(7)
    expect(parseChord('Solm')!.quality.id).toBe('min')
  })

  it('parses slash chords', () => {
    const chord = parseChord('Cmaj7/G')
    expect(chord!.rootPc).toBe(0)
    expect(chord!.quality.id).toBe('maj7')
    expect(chord!.bassPc).toBe(7)
    expect(chord!.anglo).toBe('Cmaj7/G')
  })

  it('parses altered and extended qualities', () => {
    expect(parseChord('F#dim')!.rootPc).toBe(6)
    expect(parseChord('F#dim')!.quality.id).toBe('dim')
    expect(parseChord('A7sus4')!.quality.id).toBe('7sus4')
    expect(parseChord('Cadd9')!.quality.id).toBe('add9')
    expect(parseChord('C6/9')!.quality.id).toBe('69')
    expect(parseChord('Bm7b5')!.quality.id).toBe('m7b5')
    expect(parseChord('Dø')!.quality.id).toBe('m7b5')
  })

  it('rejects junk', () => {
    expect(parseChord('H7')).toBeNull()
    expect(parseChord('Cxyz')).toBeNull()
    expect(parseChord('')).toBeNull()
    expect(parseChord('C/H')).toBeNull()
  })

  it('formats labels', () => {
    const parsed = parseChord('Am7')!
    expect(chordLabel(parsed, 'anglo')).toBe('Am7')
    expect(chordLabel(parsed, 'latin')).toBe('La m7')
    expect(chordLabel(parsed, 'both')).toBe('Am7 · La m7')
    expect(formatChord(10, 'm7').anglo).toBe('Bbm7')
    expect(formatChord(9, '7', { bassPc: 0 }).anglo).toBe('A7/C')
  })
})
