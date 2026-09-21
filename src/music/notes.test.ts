import { describe, expect, it } from 'vitest'
import {
  bothNames,
  chordAccidental,
  keyAccidental,
  latinName,
  midiToFreq,
  pcFromName,
  pitchName,
} from './notes'

describe('pcFromName', () => {
  it('parses anglo names', () => {
    expect(pcFromName('C')).toBe(0)
    expect(pcFromName('C#')).toBe(1)
    expect(pcFromName('Db')).toBe(1)
    expect(pcFromName('Bb')).toBe(10)
    expect(pcFromName('F#')).toBe(6)
    expect(pcFromName('Cb')).toBe(11)
  })

  it('parses latin names', () => {
    expect(pcFromName('Do')).toBe(0)
    expect(pcFromName('Do#')).toBe(1)
    expect(pcFromName('Reb')).toBe(1)
    expect(pcFromName('Sib')).toBe(10)
    expect(pcFromName('Sol')).toBe(7)
    expect(pcFromName('Solb')).toBe(6)
    expect(pcFromName('Si')).toBe(11)
  })

  it('rejects junk', () => {
    expect(pcFromName('H')).toBeNull()
    expect(pcFromName('')).toBeNull()
    expect(pcFromName('Cx')).toBeNull()
  })
})

describe('frequency', () => {
  it('A4 is 440', () => {
    expect(midiToFreq(69)).toBeCloseTo(440)
  })

  it('low E is about 82.41', () => {
    expect(midiToFreq(40)).toBeCloseTo(82.4069, 3)
  })
})

describe('names', () => {
  it('spells sharps and flats', () => {
    expect(pitchName(1)).toBe('C#')
    expect(pitchName(1, 'flat')).toBe('Db')
    expect(latinName(10, 'flat')).toBe('Sib')
    expect(bothNames(6)).toEqual({ anglo: 'F#', latin: 'Fa#' })
  })
})

describe('accidental preference', () => {
  it('uses flats for flat roots', () => {
    expect(chordAccidental(10)).toBe('flat')
    expect(chordAccidental(0)).toBe('sharp')
    expect(keyAccidental(5, 'major')).toBe('flat')
    expect(keyAccidental(2, 'minor')).toBe('flat')
    expect(keyAccidental(7, 'major')).toBe('sharp')
  })
})
