import { describe, expect, it } from 'vitest'
import { detectChord, detectFromMidi } from './detectChord'

const fret = (values: string): (number | null)[] =>
  values.split(',').map((value) => (value === 'x' ? null : Number(value)))

describe('detectChord', () => {
  it('detects open C with its notes', () => {
    const result = detectChord(fret('x,3,2,0,1,0'))
    expect(result.candidates[0].anglo).toBe('C')
    expect(result.notes.map((note) => note.anglo)).toEqual(['C', 'E', 'G', 'C', 'E'])
  })

  it('detects common open chords', () => {
    expect(detectChord(fret('x,0,2,2,1,0')).candidates[0].anglo).toBe('Am')
    expect(detectChord(fret('0,2,2,0,0,0')).candidates[0].anglo).toBe('Em')
    expect(detectChord(fret('3,2,0,0,0,3')).candidates[0].anglo).toBe('G')
  })

  it('shows the C6 vs Am ambiguity, decided by the bass', () => {
    const c6 = detectChord(fret('x,3,2,2,1,0'))
    expect(c6.candidates[0].anglo).toBe('C6')
    expect(c6.candidates.map((candidate) => candidate.anglo)).toContain('Am/C')

    const am7 = detectChord(fret('x,0,2,0,1,0'))
    expect(am7.candidates[0].anglo).toBe('Am7')
    expect(am7.candidates.map((candidate) => candidate.anglo)).toContain('C6/A')
  })

  it('detects power chords', () => {
    const result = detectChord(fret('0,2,2,x,x,x'))
    expect(result.candidates[0].anglo).toBe('E5')
  })

  it('returns nothing for silence', () => {
    expect(detectChord(fret('x,x,x,x,x,x')).candidates).toEqual([])
  })
})

describe('bass note', () => {
  it('uses the lowest sounding note, not the lowest string', () => {
    // B2 on the 6th string (fret 7) sits above the open A2 on the 5th.
    expect(detectChord([7, 0, 2, 2, 2, 0]).bassPc).toBe(9)
  })
})

describe('slash-chord bass spelling', () => {
  it('spells the bass from the chord, by interval', () => {
    const names = (midi: number[]) => detectFromMidi(midi).candidates.map((candidate) => candidate.anglo)
    expect(names([51, 58, 63, 67])).toContain('Cm7/Eb')
    expect(names([58, 62, 67])).toContain('Gm/Bb')
    expect(names([54, 57, 62])).toContain('D/F#')
    expect(names([46, 52, 55, 60])).toContain('C7/Bb')
  })
})
