import { describe, expect, it } from 'vitest'
import { decodeShare, encodeShare, shareUrl } from './share'

const step = (anglo: string, extra: object = {}) => ({ ...decodeShare(`p=${encodeURIComponent(anglo)}`)!.steps[0], ...extra })

describe('share links', () => {
  it('round-trips chords, shapes, strums and settings', () => {
    const shared = {
      steps: [step('C'), step('G', { frets: [3, 2, 0, 0, 0, 3], voicingLabel: '3 2 0 0 0 3', voicingSource: 'proof' as const }), step('C#m', { strum: 'folk' as const }), step('F/C')],
      tempo: 96,
      beatsPerChord: 2,
      capo: 3,
      strum: 'ballad' as const,
    }
    const encoded = encodeShare(shared)
    expect(decodeURIComponent(encoded)).toContain('p=C_G:3-2-0-0-0-3_C#m~folk_F/C')
    expect(decodeShare(encoded)).toEqual(shared)
  })

  it('skips unknown chords and bad values instead of failing', () => {
    const decoded = decodeShare('p=C_Hzz_G:99-1-1-1-1-1_Am~samba&t=9999&b=3&c=12&s=polka')!
    expect(decoded.steps.map((item) => item.anglo)).toEqual(['C', 'G', 'Am'])
    expect(decoded.steps[1].frets).toBeUndefined()
    expect(decoded.steps[2].strum).toBeUndefined()
    expect(decoded).not.toHaveProperty('tempo')
    expect(decoded).not.toHaveProperty('beatsPerChord')
    expect(decoded).not.toHaveProperty('capo')
    expect(decoded).not.toHaveProperty('strum')
  })

  it('returns null without a progression', () => {
    expect(decodeShare('')).toBeNull()
    expect(decodeShare('p=Hzz')).toBeNull()
  })

  it('keeps the current view in the link', () => {
    const url = shareUrl({ steps: [step('Am')] }, { origin: 'https://x.dev', pathname: '/', hash: '#theory' })
    expect(url).toBe('https://x.dev/?p=Am#theory')
  })
})
