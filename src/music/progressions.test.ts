import { describe, expect, it } from 'vitest'
import { PROGRESSIONS, moveStep, nextChordSuggestions, resolveProgression } from './progressions'

const byId = (id: string) => PROGRESSIONS.find((progression) => progression.id === id)!

describe('progressions', () => {
  it('resolves pop I–V–vi–IV in C', () => {
    expect(resolveProgression(byId('pop-1564'), 0).map((step) => step.anglo)).toEqual(['C', 'G', 'Am', 'F'])
  })

  it('resolves the Andalusian cadence in A minor', () => {
    expect(resolveProgression(byId('andalusian'), 9).map((step) => step.anglo)).toEqual(['Am', 'G', 'F', 'E'])
  })

  it('resolves the twelve-bar blues in A', () => {
    const steps = resolveProgression(byId('blues-12'), 9)
    expect(steps).toHaveLength(12)
    expect(steps[4].anglo).toBe('D7')
    expect(steps[8].anglo).toBe('E7')
  })

  it('transposes to Bb without wrong spellings', () => {
    expect(resolveProgression(byId('pop-1564'), 10).map((step) => step.anglo)).toEqual([
      'Bb',
      'F',
      'Gm',
      'Eb',
    ])
  })

  it('suggests the tonic after the dominant', () => {
    const suggestions = nextChordSuggestions(7, 0, 'major')
    expect(suggestions[0].anglo).toBe('C')
    expect(suggestions[0].reasonEs).toContain('Cadencia')
  })

  it('suggests useful options from the tonic', () => {
    const labels = nextChordSuggestions(0, 0, 'major').map((suggestion) => suggestion.anglo)
    expect(labels.some((label) => label === 'F' || label === 'G')).toBe(true)
    expect(labels).toContain('G7')
  })

  it('moves a step forward', () => {
    expect(moveStep(['A', 'B', 'C', 'D'], 0, 2)).toEqual(['B', 'C', 'A', 'D'])
  })

  it('moves a step backward', () => {
    expect(moveStep(['A', 'B', 'C', 'D'], 3, 1)).toEqual(['A', 'D', 'B', 'C'])
  })

  it('returns the same list when the position does not change', () => {
    const steps = ['A', 'B', 'C']
    expect(moveStep(steps, 1, 1)).toBe(steps)
  })

  it('ignores out-of-range moves', () => {
    const steps = ['A', 'B', 'C']
    expect(moveStep(steps, -1, 1)).toBe(steps)
    expect(moveStep(steps, 0, 3)).toBe(steps)
    expect(moveStep(steps, 0, -1)).toBe(steps)
  })
})
