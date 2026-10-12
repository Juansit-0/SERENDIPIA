import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, sanitizeSettings } from './settings'

describe('sanitizeSettings', () => {
  it('keeps valid stored settings', () => {
    const stored = { ...DEFAULT_SETTINGS, lang: 'en', timbre: 'jazz', tuningId: 'drop-d', tempo: 120, capo: 3, beatsPerChord: 8 }
    expect(sanitizeSettings(stored)).toEqual(stored)
  })

  it('falls back field by field on corrupt values', () => {
    const result = sanitizeSettings({
      lang: 'fr',
      timbre: 'banjo',
      tuningId: 'nashville',
      tempo: 9999,
      volume: -1,
      keyRootPc: 12.5,
      keyMode: 'dorian',
      loop: 'yes',
      beatsPerChord: 3,
      capo: 40,
      notation: 'latin',
    })
    expect(result).toEqual({ ...DEFAULT_SETTINGS, notation: 'latin' })
  })

  it('tolerates non-object input', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(sanitizeSettings('oops')).toEqual(DEFAULT_SETTINGS)
    expect(sanitizeSettings([1, 2])).toEqual(DEFAULT_SETTINGS)
  })
})
