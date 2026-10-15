import { describe, expect, it } from 'vitest'
import { toneWord } from './roles'
import { ARC_BODIES, moonPath, sunAngle } from './SkyArc'

describe('sky over the fretboard', () => {
  it('the sun rises on the left, crosses noon and sets on the right', () => {
    expect(sunAngle(0)).toBe(180)
    expect(sunAngle(ARC_BODIES - 1)).toBe(0)
    for (let i = 1; i < ARC_BODIES; i += 1) expect(sunAngle(i)).toBeLessThan(sunAngle(i - 1))
  })

  it('the moon goes new → full → new', () => {
    expect(moonPath(0)).toBeNull()
    expect(moonPath(4)).toContain('0 1 1')
    expect(moonPath(2)).not.toBeNull()
  })
})

describe('chord tones in words', () => {
  it('names the root and the intervals plainly', () => {
    expect(toneWord(0, 'm7', 'es')).toBe('Raíz')
    expect(toneWord(3, 'm7', 'es')).toBe('3ª menor')
    expect(toneWord(7, 'maj', 'en')).toBe('perfect 5th')
    expect(toneWord(9, 'dim7', 'es')).toBe('7ª disminuida')
    expect(toneWord(5, 'sus4', 'es')).toBe('4ª (en lugar de la 3ª)')
  })
})
