import { describe, expect, it } from 'vitest'
import { PROGRESSIONS, nextChordSuggestions, resolveProgression } from './progressions'

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
})
