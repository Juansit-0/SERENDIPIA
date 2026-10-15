import { describe, expect, it } from 'vitest'
import { parseSheet, SAMPLE_SHEET } from './chordpro'

describe('ChordPro', () => {
  it('puts each chord over the syllable that follows it', () => {
    const sheet = parseSheet('[C]Hoy el [G]cielo [Am]tiene [F]luz')
    const line = sheet.lines[0]
    expect(line.kind).toBe('lyrics')
    if (line.kind !== 'lyrics') return
    expect(line.segments.map((s) => [s.chord, s.text])).toEqual([
      ['C', 'Hoy el '],
      ['G', 'cielo '],
      ['Am', 'tiene '],
      ['F', 'luz'],
    ])
    expect(sheet.chords.map((chord) => chord.anglo)).toEqual(['C', 'G', 'Am', 'F'])
    expect(line.segments.map((s) => s.index)).toEqual([0, 1, 2, 3])
  })

  it('reads directives, lyrics before the first chord, chords with no lyrics and choruses', () => {
    const sheet = parseSheet(SAMPLE_SHEET)
    expect(sheet.title).toBe('Mi canción')
    expect(sheet.lines[0]).toEqual({ kind: 'comment', text: 'Verso' })
    const chorus = sheet.lines.find((line) => line.kind === 'lyrics' && line.chorus)
    expect(chorus).toBeTruthy()
    const lead = parseSheet('Oh [Em]oh [D][C]')
    const segments = lead.lines[0].kind === 'lyrics' ? lead.lines[0].segments : []
    expect(segments.map((s) => [s.chord, s.text])).toEqual([[null, 'Oh '], ['Em', 'oh '], ['D', ''], ['C', '']])
  })

  it('keeps unknown chords visible but out of playback, and transposes known ones', () => {
    const sheet = parseSheet('[Xyz]la [G]la', 2)
    const segments = sheet.lines[0].kind === 'lyrics' ? sheet.lines[0].segments : []
    expect(segments.map((s) => [s.chord, s.index])).toEqual([['Xyz', -1], ['A', 0]])
    expect(sheet.chords.map((chord) => chord.anglo)).toEqual(['A'])
  })
})

describe('placing chords without brackets', () => {
  it('finds each word and the chord in front of it', async () => {
    const { lineSlots } = await import('./chordpro')
    const slots = lineSlots('[C]Hoy el [G]cielo a[Am]quí')
    expect(slots.map((slot) => [slot.word, slot.chord?.name ?? null])).toEqual([
      ['Hoy', 'C'],
      ['el', null],
      ['cielo', 'G'],
      ['a', null],
      ['quí', 'Am'],
    ])
  })

  it('puts, changes and takes off a chord on a word', async () => {
    const { lineSlots, setChordAt } = await import('./chordpro')
    let line = 'Hoy el cielo tiene luz'
    line = setChordAt(line, lineSlots(line)[2], 'G')
    expect(line).toBe('Hoy el [G]cielo tiene luz')
    line = setChordAt(line, lineSlots(line)[0], 'C')
    expect(line).toBe('[C]Hoy el [G]cielo tiene luz')
    line = setChordAt(line, lineSlots(line)[2], 'Em')
    expect(line).toBe('[C]Hoy el [Em]cielo tiene luz')
    line = setChordAt(line, lineSlots(line)[0], null)
    expect(line).toBe('Hoy el [Em]cielo tiene luz')
  })

  it('turns a song posted with chords on top into ChordPro', async () => {
    const { chordsOverLyrics, parseSheet } = await import('./chordpro')
    const pasted = ['C           G', 'Hoy el cielo tiene luz', '', 'Am   F', 'Y si me quedo', 'G  C'].join('\n')
    const { text, converted } = chordsOverLyrics(pasted)
    expect(converted).toBe(true)
    expect(text.split('\n')).toEqual(['[C]Hoy el cielo [G]tiene luz', '', '[Am]Y si [F]me quedo', '[G] [C]'])
    expect(parseSheet(text).chords.map((chord) => chord.anglo)).toEqual(['C', 'G', 'Am', 'F', 'G', 'C'])
    expect(chordsOverLyrics('Solo letra, sin acordes').converted).toBe(false)
  })
})
