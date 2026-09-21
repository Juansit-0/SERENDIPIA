import { describe, expect, it } from 'vitest'
import { detectChord } from './detectChord'

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
