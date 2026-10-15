import { describe, expect, it } from 'vitest'
import { FIGURES, place } from './layouts'

describe('welcome figures', () => {
  it('has one figure per welcome step', () => {
    expect(FIGURES).toHaveLength(6)
  })

  it('places exactly the requested particles, dots first and bigger than line stars', () => {
    for (const figure of FIGURES) {
      const placements = place(figure, 1700)
      expect(placements).toHaveLength(1700)
      const dots = placements.slice(0, figure.dots.length)
      const lines = placements.slice(figure.dots.length).filter((p) => p.size > 0)
      expect(lines.length).toBeGreaterThan(200)
      expect(Math.min(...dots.map((p) => p.size))).toBeGreaterThan(Math.max(...lines.map((p) => p.size)))
    }
  })

  it('keeps every figure inside the frame', () => {
    for (const figure of FIGURES) {
      for (const p of place(figure, 1700).filter((p) => p.size > 0)) {
        expect(Math.abs(p.x)).toBeLessThanOrEqual(3.3)
        expect(Math.abs(p.y)).toBeLessThanOrEqual(2.75)
      }
    }
  })

  it('colours the constellation stars by harmonic function (C G Am F)', () => {
    expect(FIGURES[2].dots.map((dot) => dot.hue)).toEqual(['tonic', 'dom', 'tonic', 'sub'])
  })

  it('is the same on every visit', () => {
    expect(place(FIGURES[3], 500)).toEqual(place(FIGURES[3], 500))
  })
})
