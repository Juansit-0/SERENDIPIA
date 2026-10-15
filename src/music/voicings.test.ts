import { describe, expect, it } from 'vitest'
import { QualityId, chordTones, essentialTones, qualityById } from './chords'
import { COMMON_SHAPES, STANDARD_TUNING, voicingsFor } from './voicings'

describe('voicingsFor', () => {
  it('finds the classic open C first', () => {
    const voicings = voicingsFor(0, qualityById('maj'))
    expect(voicings.length).toBeGreaterThan(0)
    expect(voicings[0].signature).toBe('x,3,2,0,1,0')
    expect(voicings[0].source).toBe('common')
    expect(voicings[0].fingers).toEqual([null, 3, 2, null, 1, null])
    expect(voicings[0].difficulty).toBe('easy')
  })

  it('respects span limits and essential tones', () => {
    const voicings = voicingsFor(6, qualityById('m7'))
    expect(voicings.length).toBeGreaterThan(0)
    for (const voicing of voicings) {
      expect(voicing.span).toBeLessThanOrEqual(4)
      const pcs = new Set(voicing.midi.map((note) => ((note % 12) + 12) % 12))
      for (const essential of essentialTones(6, qualityById('m7'))) {
        expect(pcs.has(essential)).toBe(true)
      }
    }
  })

  it('produces a barre for F#m', () => {
    const voicings = voicingsFor(6, qualityById('min'))
    const barred = voicings.find((voicing) => voicing.barre)
    expect(barred).toBeDefined()
    expect(barred!.barre!.fret).toBeGreaterThan(0)
  })

  it('honours a slash bass', () => {
    const voicings = voicingsFor(0, qualityById('maj'), STANDARD_TUNING, { bassPc: 4 })
    expect(voicings.length).toBeGreaterThan(0)
    for (const voicing of voicings) {
      expect(((voicing.midi[0] % 12) + 12) % 12).toBe(4)
    }
  })

  it('dedupes and limits', () => {
    const voicings = voicingsFor(9, qualityById('min'), STANDARD_TUNING, { limit: 5 })
    expect(voicings.length).toBeLessThanOrEqual(5)
    const signatures = voicings.map((voicing) => voicing.signature)
    expect(new Set(signatures).size).toBe(signatures.length)
  })
})

describe('COMMON_SHAPES', () => {
  const entries = Object.entries(COMMON_SHAPES).flatMap(([key, shapes]) => shapes.map((shape) => ({ key, shape })))

  it.each(entries)('$key $shape contains only chord tones and every essential tone', ({ key, shape }) => {
    const [root, qualityId] = key.split(':')
    const rootPc = Number(root)
    const quality = qualityById(qualityId as QualityId)
    const allowed = new Set(chordTones(rootPc, quality))
    const sounding = shape
      .map((fret, index) => (fret === null || fret === -1 ? null : (STANDARD_TUNING[index] + fret) % 12))
      .filter((pc): pc is number => pc !== null)
    for (const pc of sounding) expect(allowed.has(pc)).toBe(true)
    for (const pc of essentialTones(rootPc, quality)) expect(sounding).toContain(pc)
    expect(sounding).toContain(rootPc)
  })
})

describe('alternate tunings', () => {
  it('every tuning finds playable shapes for the common open-key chords', async () => {
    const { TUNINGS } = await import('./voicings')
    const { qualityById } = await import('./chords')
    for (const tuning of TUNINGS) {
      for (const [rootPc, qualityId] of [
        [2, 'maj'],
        [7, 'maj'],
        [9, 'min'],
        [0, 'maj'],
      ] as const) {
        const shapes = voicingsFor(rootPc, qualityById(qualityId), tuning.midi)
        expect(shapes.length, `${tuning.id} ${rootPc}:${qualityId}`).toBeGreaterThan(0)
      }
    }
  })
})

describe('shapes in alternate tunings', () => {
  it('never offers a curated shape that rings a note outside the chord', async () => {
    const { TUNINGS } = await import('./voicings')
    const { qualityById, chordTones } = await import('./chords')
    for (const tuning of TUNINGS) {
      for (let rootPc = 0; rootPc < 12; rootPc += 1) {
        for (const qualityId of ['maj', 'min', '7', 'm7', 'maj7'] as const) {
          const tones = new Set(chordTones(rootPc, qualityById(qualityId)))
          for (const voicing of voicingsFor(rootPc, qualityById(qualityId), tuning.midi)) {
            const foreign = voicing.midi.filter((note) => !tones.has(note % 12))
            expect(foreign, `${tuning.id} ${rootPc}:${qualityId} ${voicing.frets.join(',')}`).toEqual([])
          }
        }
      }
    }
  })

  it('spells the open strings as the tuning is named', async () => {
    const { TUNINGS, stringLabels } = await import('./voicings')
    const midi = (id: string) => TUNINGS.find((tuning) => tuning.id === id)!.midi
    expect(stringLabels(midi('open-d'))[3]).toMatch(/^F[#♯]$/)
    expect(stringLabels(midi('open-e'))[3]).toMatch(/^G[#♯]$/)
    expect(stringLabels(midi('half-step'))[0]).toMatch(/^E[b♭]$/)
  })
})
