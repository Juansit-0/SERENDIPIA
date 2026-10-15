import { describe, expect, it } from 'vitest'
import { bassLine, bassMidi, drumsAt, GROOVES } from './backing'

describe('backing band', () => {
  it('keeps the bass between E1 and D#2', () => {
    expect(bassMidi(4)).toBe(28)
    expect(bassMidi(3)).toBe(39)
    for (let pc = 0; pc < 12; pc += 1) {
      expect(bassMidi(pc) % 12).toBe(pc)
      expect(bassMidi(pc)).toBeGreaterThanOrEqual(28)
      expect(bassMidi(pc)).toBeLessThanOrEqual(39)
    }
  })

  it('pop: kick on 1, snare on 2 and 4, hats on every eighth', () => {
    const parts = (eighth: number) => drumsAt('pop', eighth).map((hit) => hit.part)
    expect(parts(0)).toEqual(['kick', 'hat'])
    expect(parts(2)).toEqual(['snare', 'hat'])
    expect(parts(6)).toEqual(['snare', 'hat'])
    // The groove runs on across chord changes: eighth 10 is beat 2 of bar two.
    expect(parts(10)).toEqual(['snare', 'hat'])
    expect(drumsAt('none', 0)).toEqual([])
  })

  it('every groove stays on its grid', () => {
    for (const groove of Object.values(GROOVES)) {
      for (const hits of Object.values(groove.hits)) for (const eighth of hits!) expect(eighth).toBeLessThan(groove.length)
    }
  })

  it('the bass plays the chord bass, cut to the length of the chord', () => {
    const half = bassLine('pop', 4, 7)
    expect(half.map((note) => note.eighth)).toEqual([0, 3])
    expect(half.every((note) => note.midi % 12 === 7)).toBe(true)
    const twoBars = bassLine('ballad', 16, 9)
    expect(twoBars.filter((note) => note.eighth === 8)).toHaveLength(1)
    expect(Math.max(...twoBars.map((note) => note.eighth + note.length))).toBeLessThanOrEqual(16)
    expect(bassLine('none', 8, 0)).toEqual([])
  })
  it('the bass walks into the next chord a semitone away', () => {
    // C to G: the last eighth leads into G from a half step.
    const line = bassLine('rock', 8, 0, 7)
    const last = line[line.length - 1]
    expect(last.eighth).toBe(7)
    expect(Math.abs((last.midi % 12) - 7)).toBe(1)
    expect(line.slice(0, -1).every((note) => note.midi % 12 === 0)).toBe(true)
    // Same bass, or no next chord: no approach note.
    expect(bassLine('rock', 8, 0, 0).every((note) => note.midi % 12 === 0)).toBe(true)
    expect(bassLine('pop', 8, 0, null).some((note) => note.midi % 12 !== 0 && note.midi % 12 !== 7)).toBe(false)
    // Notes never overlap the approach, and never drop under the low E.
    for (let pc = 0; pc < 12; pc += 1) {
      for (const style of ['pop', 'ballad', 'rock', 'bossa'] as const) {
        const notes = bassLine(style, 8, pc, (pc + 5) % 12)
        expect(Math.min(...notes.map((note) => note.midi))).toBeGreaterThanOrEqual(28)
        for (const note of notes) expect(note.eighth + note.length).toBeLessThanOrEqual(note.eighth === 7 ? 8 : 7)
      }
    }
  })

  it('the open hat closes the phrase in pop and rock, and bossa plays with brushes', () => {
    expect(drumsAt('pop', 15).map((hit) => hit.part)).toEqual(['open'])
    expect(drumsAt('rock', 15).map((hit) => hit.part)).toContain('open')
    expect(drumsAt('bossa', 1).map((hit) => hit.part)).toEqual(['brushHat'])
    expect(drumsAt('ballad', 4).map((hit) => hit.part)).toContain('rim')
  })
})
