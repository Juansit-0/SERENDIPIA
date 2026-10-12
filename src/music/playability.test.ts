import { describe, expect, it } from 'vitest'
import { parseChord } from './parseChord'
import { autoVoicing } from './stepVoicing'
import { chainVoicings, handPosition, movementCost, recommendCapo, totalMovement } from './playability'

const steps = (...names: string[]) =>
  names.map((name) => {
    const parsed = parseChord(name)!
    return { rootPc: parsed.rootPc, qualityId: parsed.quality.id, bassPc: parsed.bassPc }
  })

const label = (frets: (number | null)[] | null) => frets?.map((fret) => (fret === null ? 'x' : fret)).join('')

describe('movement helpers', () => {
  it('places the hand at the average fretted position', () => {
    expect(handPosition([null, 3, 2, 0, 1, 0])).toBe(2)
    expect(handPosition([0, 0, 0, 0, 0, 0])).toBe(0)
  })

  it('rewards held fingers and punishes jumps', () => {
    const c = [null, 3, 2, 0, 1, 0]
    const am = [null, 0, 2, 2, 1, 0]
    const barreF = [1, 3, 3, 2, 1, 1]
    expect(movementCost(c, am)).toBeLessThan(movementCost(c, [null, null, 10, 9, 8, 8]))
    expect(movementCost(c, c)).toBeLessThan(0)
    expect(movementCost(am, barreF)).toBeGreaterThan(0)
  })
})

describe('chainVoicings', () => {
  it('keeps an open-position progression in open position', () => {
    const chain = chainVoicings(steps('C', 'Am', 'F', 'G'))
    expect(chain).toHaveLength(4)
    for (const frets of chain) expect(handPosition(frets!)).toBeLessThanOrEqual(3)
    expect(label(chain[0])).toBe('x32010')
  })

  it('never moves the hand more than picking each chord on its own', () => {
    for (const names of [['Bm', 'G', 'D', 'A'], ['F#m', 'D', 'A', 'E'], ['Dm7', 'G7', 'Cmaj7', 'A7']]) {
      const chained = chainVoicings(steps(...names))
      const independent = steps(...names).map((step) => autoVoicing(step.rootPc, step.qualityId)?.frets ?? null)
      expect(totalMovement(chained)).toBeLessThanOrEqual(totalMovement(independent) + 1e-9)
    }
  })

  it('handles empty input', () => {
    expect(chainVoicings([])).toEqual([])
  })
})

describe('recommendCapo', () => {
  it('suggests a capo that turns barre chords into open shapes', () => {
    // Bb Gm Eb F sounds like G Em C D with capo 3.
    const pick = recommendCapo(steps('Bb', 'Gm', 'Eb', 'F'), 0)
    expect(pick?.capo).toBe(3)
    expect(pick?.shapes.map((shape) => shape.anglo)).toEqual(['G', 'Em', 'C', 'D'])
  })

  it('stays quiet when the progression is already easy', () => {
    expect(recommendCapo(steps('C', 'G', 'Am', 'F'), 0)).toBeNull()
    expect(recommendCapo([], 0)).toBeNull()
  })

  it('accounts for a capo that is already on', () => {
    // G Em C D shapes with capo 3 already sound as Bb Gm Eb F: nothing to improve.
    expect(recommendCapo(steps('G', 'Em', 'C', 'D'), 3)).toBeNull()
  })
})
