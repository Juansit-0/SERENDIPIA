/*
 * Scales on the neck: every place a scale's notes fall, by position, with the degree each note plays.
 */

export interface ScaleDef {
  id: ScaleId
  intervals: number[]
  nameEs: string
  nameEn: string
}

export type ScaleId = 'major' | 'minor' | 'pentMajor' | 'pentMinor' | 'blues' | 'harmonicMinor'

export const SCALES: ScaleDef[] = [
  { id: 'major', intervals: [0, 2, 4, 5, 7, 9, 11], nameEs: 'Mayor', nameEn: 'Major' },
  { id: 'minor', intervals: [0, 2, 3, 5, 7, 8, 10], nameEs: 'Menor', nameEn: 'Minor' },
  { id: 'pentMajor', intervals: [0, 2, 4, 7, 9], nameEs: 'Pentatónica mayor', nameEn: 'Major pentatonic' },
  { id: 'pentMinor', intervals: [0, 3, 5, 7, 10], nameEs: 'Pentatónica menor', nameEn: 'Minor pentatonic' },
  { id: 'blues', intervals: [0, 3, 5, 6, 7, 10], nameEs: 'Blues', nameEn: 'Blues' },
  { id: 'harmonicMinor', intervals: [0, 2, 3, 5, 7, 8, 11], nameEs: 'Menor armónica', nameEn: 'Harmonic minor' },
]

export const scaleById = (id: ScaleId) => SCALES.find((scale) => scale.id === id)!

/** Degree names as guitarists say them. */
export const DEGREE_NAMES: Record<number, string> = {
  0: '1',
  1: '♭2',
  2: '2',
  3: '♭3',
  4: '3',
  5: '4',
  6: '♭5',
  7: '5',
  8: '♭6',
  9: '6',
  10: '♭7',
  11: '7',
}

export interface BoardNote {
  string: number
  fret: number
  midi: number
  pc: number
  /** Semitones above the scale root. */
  degree: number
}

const mod12 = (value: number) => ((value % 12) + 12) % 12

export function boardNotes(rootPc: number, intervals: number[], tuning: number[], lastFret = 15): BoardNote[] {
  const inScale = new Set(intervals.map((interval) => mod12(rootPc + interval)))
  const notes: BoardNote[] = []
  tuning.forEach((open, string) => {
    for (let fret = 0; fret <= lastFret; fret += 1) {
      const midi = open + fret
      const pc = mod12(midi)
      if (inScale.has(pc)) notes.push({ string, fret, midi, pc, degree: mod12(pc - rootPc) })
    }
  })
  return notes
}

export interface ScalePosition {
  /** First fret of the box. */
  from: number
  /** Last fret of the box. */
  to: number
}

/**
 * Boxes up the neck, one starting on each scale note of the lowest string (frets 0–11), each spanning
 * four frets beyond it — the shapes guitarists learn one at a time.
 */
export function scalePositions(rootPc: number, intervals: number[], tuning: number[]): ScalePosition[] {
  return boardNotes(rootPc, intervals, tuning, 11)
    .filter((note) => note.string === 0)
    .map((note) => ({ from: note.fret, to: note.fret + 4 }))
}

/** The scale that suits a key by default: its own major or natural minor. */
export const defaultScale = (mode: 'major' | 'minor'): ScaleId => (mode === 'major' ? 'major' : 'minor')
