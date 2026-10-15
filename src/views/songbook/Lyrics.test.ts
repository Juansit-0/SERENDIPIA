import { describe, expect, it } from 'vitest'
import { parseSheet } from '../../music/chordpro'
import { wordUnits } from './Lyrics'

const units = (text: string) =>
  wordUnits((parseSheet(text).lines[0] as { segments: Parameters<typeof wordUnits>[0] }).segments).map((unit) =>
    unit.map((piece) => `${piece.segment?.chord ? `[${piece.segment.chord}]` : ''}${piece.text}`).join(''),
  )

describe('words that never break', () => {
  it('keeps a word whole when a chord falls in the middle of it', () => {
    expect(units('[C]Hoy el cielo se a[G]brió sin avisar')).toEqual(['[C]Hoy ', 'el ', 'cielo ', 'se ', 'a[G]brió ', 'sin ', 'avisar'])
  })

  it('a chord over a space or at the end of the line stays where it was written', () => {
    expect(units('[Am]una estrella [F]')).toEqual(['[Am]una ', 'estrella ', '[F]'])
  })
})
