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

describe('typed spelling', () => {
  it('keeps the sharps or flats the user typed', () => {
    expect(parseChord('C#m')?.anglo).toBe('C#m')
    expect(parseChord('F#')?.anglo).toBe('F#')
    expect(parseChord('Gb')?.anglo).toBe('Gb')
    expect(parseChord('Dbm')?.anglo).toBe('Dbm')
    expect(parseChord('Sol#m')?.latin).toBe('Sol# m')
    expect(parseChord('Sib')?.anglo).toBe('Bb')
  })

  it('prefers sharps for minor chords on black keys when nothing was typed', () => {
    expect(formatChord(1, 'min').anglo).toBe('C#m')
    expect(formatChord(6, 'min').anglo).toBe('F#m')
    expect(formatChord(8, 'm7').anglo).toBe('G#m7')
    expect(formatChord(3, 'min').anglo).toBe('Ebm')
    expect(formatChord(1, 'maj').anglo).toBe('Db')
  })

  it('accepts suffixes in any case', () => {
    expect(parseChord('CMaj7')?.quality.id).toBe('maj7')
    expect(parseChord('CSus4')?.quality.id).toBe('sus4')
    expect(parseChord('Cm7')?.quality.id).toBe('m7')
    expect(parseChord('CM7')?.quality.id).toBe('maj7')
  })
})

describe('formatChord bass', () => {
  it('names the bass in the chord’s own spelling', () => {
    expect(formatChord(7, 'min', { bassPc: 10 }).anglo).toBe('Gm/Bb')
    expect(formatChord(2, 'min', { bassPc: 10 }).anglo).toBe('Dm/Bb')
    expect(formatChord(0, 'min', { bassPc: 3 }).anglo).toBe('Cm/Eb')
    expect(formatChord(0, '7', { bassPc: 10 }).anglo).toBe('C7/Bb')
    expect(formatChord(2, 'maj', { bassPc: 6 }).anglo).toBe('D/F#')
    expect(formatChord(3, 'maj', { bassPc: 10 }).anglo).toBe('Eb/Bb')
    expect(formatChord(9, 'min', { bassPc: 10 }).latin).toBe('La m/Sib')
  })
})
