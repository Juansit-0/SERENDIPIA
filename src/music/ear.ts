import { chordTones, qualityById, type QualityId } from './chords'

/*
 * Ear training: the app plays a chord (or two notes) and the player names its quality (or the interval).
 * Pure: questions come from an injectable random source so they can be tested.
 */

export type EarMode = 'quality' | 'interval'

/** Each level adds answers to the previous ones. */
export const QUALITY_LEVELS: QualityId[][] = [
  ['maj', 'min'],
  ['maj', 'min', 'dim', 'aug'],
  ['maj', 'min', '7', 'maj7', 'm7'],
  ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4', '7', 'maj7', 'm7', 'm7b5'],
]

/** Semitones. */
export const INTERVAL_LEVELS: number[][] = [
  [4, 7, 12],
  [3, 4, 5, 7, 12],
  [2, 3, 4, 5, 7, 9, 12],
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
]

export const INTERVAL_NAMES: Record<number, { es: string; en: string }> = {
  1: { es: '2.ª menor', en: 'Minor 2nd' },
  2: { es: '2.ª mayor', en: 'Major 2nd' },
  3: { es: '3.ª menor', en: 'Minor 3rd' },
  4: { es: '3.ª mayor', en: 'Major 3rd' },
  5: { es: '4.ª justa', en: 'Perfect 4th' },
  6: { es: 'Tritono', en: 'Tritone' },
  7: { es: '5.ª justa', en: 'Perfect 5th' },
  8: { es: '6.ª menor', en: 'Minor 6th' },
  9: { es: '6.ª mayor', en: 'Major 6th' },
  10: { es: '7.ª menor', en: 'Minor 7th' },
  11: { es: '7.ª mayor', en: 'Major 7th' },
  12: { es: 'Octava', en: 'Octave' },
}

export interface EarQuestion {
  mode: EarMode
  /** QualityId for chords, semitones (as a string) for intervals. */
  answer: string
  choices: string[]
  /** What to play, low to high. */
  midi: number[]
}

export function levelCount(mode: EarMode): number {
  return mode === 'quality' ? QUALITY_LEVELS.length : INTERVAL_LEVELS.length
}

/**
 * A new question for `mode` at `level` (0-based), never repeating `previous` exactly: chords in a guitar's
 * middle register (root A2–G#3), intervals upward from E3–D#4.
 */
export function makeQuestion(mode: EarMode, level: number, random: () => number = Math.random, previous?: EarQuestion): EarQuestion {
  const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length) % items.length]
  for (let attempt = 0; attempt < 8; attempt += 1) {
    let question: EarQuestion
    if (mode === 'quality') {
      const choices = QUALITY_LEVELS[Math.min(level, QUALITY_LEVELS.length - 1)]
      const answer = pick(choices)
      const root = 45 + Math.floor(random() * 12)
      const tones = chordTones(root % 12, qualityById(answer))
      // Close voicing above the root: each tone the first time it appears over the one before.
      const midi = [root]
      for (const pc of tones.slice(1)) {
        let note = midi[midi.length - 1] + 1
        while (note % 12 !== pc) note += 1
        midi.push(note)
      }
      question = { mode, answer, choices, midi }
    } else {
      const choices = INTERVAL_LEVELS[Math.min(level, INTERVAL_LEVELS.length - 1)]
      const semitones = pick(choices)
      const base = 52 + Math.floor(random() * 12)
      question = { mode, answer: String(semitones), choices: choices.map(String), midi: [base, base + semitones] }
    }
    if (!previous || previous.answer !== question.answer || previous.midi[0] !== question.midi[0]) return question
  }
  return makeQuestion(mode, level, Math.random)
}

export interface EarRecords {
  [modeLevel: string]: number
}

const STORAGE_KEY = 'serendipia.ear.v1'
export const recordKey = (mode: EarMode, level: number) => `${mode}-${level}`

export function loadEarRecords(): EarRecords {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    if (!parsed || typeof parsed !== 'object') return {}
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => Number.isInteger(value) && (value as number) >= 0)) as EarRecords
  } catch {
    return {}
  }
}

/** Keeps the best streak per mode and level; returns the records and whether this one is new. */
export function saveEarStreak(mode: EarMode, level: number, streak: number): { records: EarRecords; best: boolean } {
  const records = loadEarRecords()
  const key = recordKey(mode, level)
  if (streak <= (records[key] ?? 0)) return { records, best: false }
  const next = { ...records, [key]: streak }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // storage unavailable: the record lasts this visit
  }
  return { records: next, best: true }
}
