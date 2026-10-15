import { describe, expect, it } from 'vitest'
import { parseSheet } from '../../music/chordpro'
import { songParts } from './sections'

const labels = { chorus: 'Coro', intro: 'Inicio' }

describe('song parts', () => {
  it('splits at section headings and at a chorus without one', () => {
    const sheet = parseSheet(
      '{comment: Verso}\n[C]Hoy el [G]cielo\n[Am]una es[F]trella\n\n{soc}\n[F]Canta [G]conmigo\n{eoc}\n\n{comment: Verso}\n[C]otra [G]vez\n{comment: Puente}\n[Am]si la [Em]duda',
    )
    expect(songParts(sheet, labels)).toEqual([
      { name: 'Verso', from: 0, to: 4 },
      { name: 'Coro', from: 4, to: 6 },
      { name: 'Verso 2', from: 6, to: 8 },
      { name: 'Puente', from: 8, to: 10 },
    ])
  })

  it('a chorus under its own heading is one part, and chords before any heading are the intro', () => {
    const sheet = parseSheet('[D]intro\n{comment: Estribillo}\n{soc}\n[G]la la [A]la\n{eoc}')
    expect(songParts(sheet, labels)).toEqual([
      { name: 'Inicio', from: 0, to: 1 },
      { name: 'Estribillo', from: 1, to: 3 },
    ])
  })
})
