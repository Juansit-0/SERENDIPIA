import { describe, expect, it } from 'vitest'
import { qualityById } from './chords'
import {
  absoluteLabel,
  findVoicingIndex,
  isPlayableFrets,
  resolveStepFrets,
  voicingLabel,
  voicingSignature,
  voicingSpan,
} from './stepVoicing'
import { STANDARD_TUNING, voicingsFor } from './voicings'

const frets = (values: string) => values.split(',').map((value) => (value === 'x' ? null : Number(value)))

describe('voicingSignature / voicingLabel', () => {
  it('formats muted strings and frets', () => {
    expect(voicingSignature(frets('x,3,2,0,1,0'))).toBe('x,3,2,0,1,0')
    expect(voicingLabel(frets('x,3,2,0,1,0'))).toBe('x 3 2 0 1 0')
    expect(voicingLabel(frets('x,x,0,2,3,2'))).toBe('x x 0 2 3 2')
  })
})

describe('isPlayableFrets', () => {
  it('accepts open and fretted shapes', () => {
    expect(isPlayableFrets(frets('x,3,2,0,1,0'))).toBe(true)
    expect(isPlayableFrets(frets('0,0,0,0,0,0'))).toBe(true)
    expect(isPlayableFrets(frets('x,x,0,2,3,2'))).toBe(true)
  })

  it('rejects single-string, negative and over-stretched shapes', () => {
    expect(isPlayableFrets(frets('x,x,x,x,x,3'))).toBe(false)
    expect(isPlayableFrets(frets('x,x,x,x,x,x'))).toBe(false)
    expect(isPlayableFrets(frets('x,-1,2,0,1,0'))).toBe(false)
    expect(isPlayableFrets(frets('x,3,2,0,1,9'))).toBe(false)
  })
})

describe('voicingSpan', () => {
  it('measures the fretted window', () => {
    expect(voicingSpan(frets('x,3,2,0,1,0'))).toBe(2)
    expect(voicingSpan(frets('0,0,0,0,0,0'))).toBe(0)
    expect(voicingSpan(frets('x,x,5,7,7,6'))).toBe(2)
  })
})

describe('resolveStepFrets', () => {
  it('keeps a stored position when it is playable', () => {
    const stored = frets('x,3,2,0,1,0')
    expect(resolveStepFrets({ frets: stored, rootPc: 0, qualityId: 'maj' })).toEqual(stored)
  })

  it('falls back to the automatic position when none is stored', () => {
    const resolved = resolveStepFrets({ rootPc: 0, qualityId: 'maj' })
    expect(resolved).toEqual(frets('x,3,2,0,1,0'))
  })

  it('ignores an unplayable stored position', () => {
    const resolved = resolveStepFrets({ frets: frets('x,x,x,x,x,3'), rootPc: 9, qualityId: 'min' })
    expect(resolved).toEqual(frets('x,0,2,2,1,0'))
  })
})

describe('slash bass in the automatic position', () => {
  const lowestPc = (frets: (number | null)[] | null) => {
    if (!frets) return null
    const index = frets.findIndex((fret) => fret !== null)
    if (index === -1) return null
    const fret = frets[index] ?? 0
    return ((STANDARD_TUNING[index] + fret) % 12 + 12) % 12
  }

  it('resolves the automatic position on the requested bass', () => {
    const withBass = resolveStepFrets({ rootPc: 7, qualityId: '69', bassPc: 4 })
    expect(lowestPc(withBass)).toBe(4)
  })

  it('keeps the root bass when no slash is stored', () => {
    const plain = resolveStepFrets({ rootPc: 7, qualityId: '69', bassPc: null })
    expect(lowestPc(plain)).toBe(7)
  })

  it('never overrides a stored position with the bass rule', () => {
    const stored = frets('3,0,0,0,0,0')
    expect(resolveStepFrets({ frets: stored, rootPc: 7, qualityId: '69', bassPc: 4 })).toEqual(stored)
  })
})

describe('findVoicingIndex', () => {
  it('finds the position inside the generated bank', () => {
    const bank = voicingsFor(0, qualityById('maj'))
    expect(findVoicingIndex(bank, frets('x,3,2,0,1,0'))).toBe(0)
    const last = bank[bank.length - 1]
    expect(findVoicingIndex(bank, last.frets)).toBeGreaterThanOrEqual(0)
  })

  it('returns -1 for an unknown or absent position', () => {
    const bank = voicingsFor(0, qualityById('maj'))
    expect(findVoicingIndex(bank, frets('x,1,2,3,4,5'))).toBe(-1)
    expect(findVoicingIndex(bank, null)).toBe(-1)
  })
})

describe('absoluteLabel', () => {
  it('shifts fretted positions by the capo and keeps open strings on the capo', () => {
    expect(absoluteLabel(frets('x,3,2,0,1,0'), 0)).toBe('x 3 2 0 1 0')
    expect(absoluteLabel(frets('x,3,2,0,1,0'), 3)).toBe('x 6 5 3 4 3')
    expect(absoluteLabel(frets('x,x,0,2,3,2'), 2)).toBe('x x 2 4 5 4')
  })
})
