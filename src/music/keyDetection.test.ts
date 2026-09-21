import { describe, expect, it } from 'vitest'
import { keyCandidates, sameKey } from './keyDetection'

const top = (symbol: string) => {
  const match = symbol.match(/^([A-G][#b]?)(.*)$/)
  if (!match) throw new Error(`bad symbol ${symbol}`)
  const letters: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
  const accidental = match[1].includes('#') ? 1 : match[1].includes('b') ? -1 : 0
  const rootPc = (letters[match[1][0]] + accidental + 12) % 12
  const qualities: Record<string, string> = { '': 'maj', m: 'min', '7': '7', m7: 'm7', maj7: 'maj7', dim: 'dim', m7b5: 'm7b5' }
  return keyCandidates({ rootPc, qualityId: qualities[match[2]] as never })[0]
}

describe('keyCandidates', () => {
  it('reads a bare major chord as its own key first', () => {
    const candidate = top('C')
    expect(candidate.keyAnglo).toBe('C')
    expect(candidate.mode).toBe('major')
    expect(candidate.roman).toBe('I')
  })

  it('offers the relative minor and the subdominant for a major chord', () => {
    const names = keyCandidates({ rootPc: 0, qualityId: 'maj' }).map(
      (candidate) => `${candidate.keyAnglo}${candidate.mode}`,
    )
    expect(names).toContain('Aminor')
    expect(names).toContain('Fmajor')
  })

  it('reads a minor chord as the minor key first, then its relative major', () => {
    const candidates = keyCandidates({ rootPc: 9, qualityId: 'min' })
    expect(candidates[0].keyAnglo).toBe('A')
    expect(candidates[0].mode).toBe('minor')
    expect(candidates[0].roman).toBe('i')
    expect(candidates.map((candidate) => candidate.keyAnglo + candidate.mode)).toContain('Cmajor')
  })

  it('reads a dominant seventh as the dominant of the key a fifth below', () => {
    const candidate = top('G7')
    expect(candidate.keyAnglo).toBe('C')
    expect(candidate.mode).toBe('major')
    expect(candidate.roman).toBe('V7')
  })

  it('reads a diminished triad as the leading tone of its key', () => {
    const candidate = top('F#dim')
    expect(candidate.keyAnglo).toBe('G')
    expect(candidate.roman).toBe('vii°')
  })

  it('reads a half-diminished chord as the ii of a minor key among the candidates', () => {
    const candidates = keyCandidates({ rootPc: 11, qualityId: 'm7b5' })
    const asMinorTwo = candidates.find((candidate) => candidate.keyAnglo === 'A' && candidate.mode === 'minor')
    expect(asMinorTwo?.roman).toBe('iiø7')
    expect(['Cmajor', 'Aminor']).toContain(`${candidates[0].keyAnglo}${candidates[0].mode}`)
  })

  it('returns at most the requested number of candidates', () => {
    expect(keyCandidates({ rootPc: 0, qualityId: 'maj' }, 2)).toHaveLength(2)
  })
})

describe('sameKey', () => {
  it('compares root and mode', () => {
    expect(sameKey({ rootPc: 0, mode: 'major' }, { rootPc: 0, mode: 'major' })).toBe(true)
    expect(sameKey({ rootPc: 0, mode: 'major' }, { rootPc: 0, mode: 'minor' })).toBe(false)
    expect(sameKey({ rootPc: 9, mode: 'minor' }, { rootPc: 0, mode: 'major' })).toBe(false)
  })
})
