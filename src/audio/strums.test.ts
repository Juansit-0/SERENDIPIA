import { describe, expect, it } from 'vitest'
import { STRUMS, isStrumId, strumHits } from './strums'

const shape = (id: Parameters<typeof strumHits>[0], beats: number) =>
  strumHits(id, beats)
    .map((hit) => `${hit.eighth}${hit.kind[0]}`)
    .join(' ')

describe('strumHits', () => {
  it('keeps the classic single strum for the whole step', () => {
    expect(strumHits('single', 4)).toEqual([{ eighth: 0, kind: 'down', accent: true, order: 0, length: 8 }])
  })

  it('lays out the folk pattern D DU UDU', () => {
    expect(shape('folk', 4)).toBe('0d 2d 3u 5u 6d 7u')
    const hits = strumHits('folk', 4)
    expect(hits.map((hit) => hit.accent)).toEqual([true, true, false, false, true, false])
    expect(hits.map((hit) => hit.length)).toEqual([2, 1, 2, 1, 1, 1])
  })

  it('cuts the pattern on short steps and repeats it on long ones', () => {
    expect(shape('folk', 2)).toBe('0d 2d 3u')
    expect(shape('quarters', 1)).toBe('0d')
    expect(strumHits('quarters', 8)).toHaveLength(8)
  })

  it('always strikes on the downbeat', () => {
    expect(shape('offbeat', 2)).toBe('0d 1u 3u')
  })

  it('numbers arpeggio notes', () => {
    expect(strumHits('arpeggio', 2).map((hit) => hit.order)).toEqual([0, 1, 2, 3])
  })

  it('validates ids', () => {
    expect(STRUMS.every((strum) => isStrumId(strum.id) && strum.slots.length === 8)).toBe(true)
    expect(isStrumId('samba')).toBe(false)
  })
})

describe('«Mi patrón»', () => {
  it('plays the bar the player wrote', async () => {
    const { setCustomPattern, strumHits, patternGlyph } = await import('./strums')
    setCustomPattern('D..UD.DU')
    expect(strumHits('custom', 4).map((hit) => `${hit.eighth}${hit.kind[0]}`)).toEqual(['0d', '3u', '4d', '6d', '7u'])
    expect(patternGlyph('D..UD.DU')).toBe('↓··↑↓·↓↑')
    setCustomPattern('nonsense')
    expect(strumHits('custom', 4).map((hit) => hit.eighth)).toEqual([0, 2, 3, 5, 6, 7])
  })
})
