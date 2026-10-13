// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { chordTones, qualityById } from './chords'
import { loadEarRecords, makeQuestion, QUALITY_LEVELS, saveEarStreak } from './ear'
import { seeded } from '../welcome/layouts'

describe('ear training questions', () => {
  it('plays exactly the tones of the chord to name, root at the bottom, in a guitar register', () => {
    const random = seeded(7)
    for (let i = 0; i < 200; i += 1) {
      const question = makeQuestion('quality', 3, random)
      expect(QUALITY_LEVELS[3]).toContain(question.answer)
      const [root] = question.midi
      expect(root).toBeGreaterThanOrEqual(45)
      expect(root).toBeLessThan(57)
      expect(new Set(question.midi.map((note) => note % 12))).toEqual(new Set(chordTones(root % 12, qualityById(question.answer as never))))
      expect([...question.midi].sort((a, b) => a - b)).toEqual(question.midi)
    }
  })

  it('plays an interval upward by the asked number of semitones', () => {
    const random = seeded(3)
    for (let i = 0; i < 100; i += 1) {
      const question = makeQuestion('interval', 3, random)
      expect(question.midi[1] - question.midi[0]).toBe(Number(question.answer))
      expect(question.choices).toContain(question.answer)
    }
  })

  it('does not ask the very same thing twice in a row', () => {
    const random = seeded(9)
    let previous = makeQuestion('quality', 0, random)
    for (let i = 0; i < 50; i += 1) {
      const next = makeQuestion('quality', 0, random, previous)
      expect(next.answer === previous.answer && next.midi[0] === previous.midi[0]).toBe(false)
      previous = next
    }
  })
})

describe('ear records', () => {
  beforeEach(() => localStorage.clear())

  it('keeps the best streak per mode and level', () => {
    expect(saveEarStreak('quality', 0, 5).best).toBe(true)
    expect(saveEarStreak('quality', 0, 3).best).toBe(false)
    expect(saveEarStreak('interval', 0, 2).best).toBe(true)
    expect(loadEarRecords()).toEqual({ 'quality-0': 5, 'interval-0': 2 })
  })
})
