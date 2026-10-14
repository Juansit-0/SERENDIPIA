/*
 * The backing band: drum grooves and bass lines per style, on an eighth-note grid. Pure data, played by the engine.
 */

export type BackingStyle = 'none' | 'pop' | 'ballad' | 'rock' | 'bossa'

export const BACKING_STYLES: Array<{ id: BackingStyle; nameEs: string; nameEn: string }> = [
  { id: 'none', nameEs: 'Sin acompañamiento', nameEn: 'No backing' },
  { id: 'pop', nameEs: 'Pop', nameEn: 'Pop' },
  { id: 'ballad', nameEs: 'Balada', nameEn: 'Ballad' },
  { id: 'rock', nameEs: 'Rock', nameEn: 'Rock' },
  { id: 'bossa', nameEs: 'Bossa nova', nameEn: 'Bossa nova' },
]

export function isBackingStyle(value: unknown): value is BackingStyle {
  return BACKING_STYLES.some((style) => style.id === value)
}

export type DrumPart = 'kick' | 'snare' | 'hat' | 'rim'

export interface Groove {
  /** Eighths in one cycle of the groove (8 = one bar of 4/4, 16 = two bars). */
  length: number
  hits: Partial<Record<DrumPart, number[]>>
  /** Eighths (within the cycle) played harder on the hi-hat. */
  accents?: number[]
}

export const GROOVES: Record<Exclude<BackingStyle, 'none'>, Groove> = {
  // Kick on 1 and 3, snare on 2 and 4, straight eighths on the hat.
  pop: { length: 8, hits: { kick: [0, 4, 5], snare: [2, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7] }, accents: [0, 2, 4, 6] },
  // Half-time: kick on 1, snare (rim) on 3, quarter hats.
  ballad: { length: 8, hits: { kick: [0, 5], rim: [4], hat: [0, 2, 4, 6] }, accents: [0, 4] },
  // Driving: kick on 1, the «and» of 2, and 3; snare 2 and 4; accented eighths.
  rock: { length: 8, hits: { kick: [0, 3, 4], snare: [2, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7] }, accents: [0, 2, 4, 6] },
  // Two bars: kick on 1 and the «and» of 2 each bar, rim on the bossa clave, soft eighths on the hat.
  bossa: { length: 16, hits: { kick: [0, 3, 4, 7, 8, 11, 12, 15], rim: [0, 3, 6, 10, 12], hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] } },
}

export interface DrumHit {
  part: DrumPart
  /** 0–1. */
  velocity: number
}

/** The drum hits on one eighth of the running groove (`eighth` counts from the start of playback). */
export function drumsAt(style: BackingStyle, eighth: number): DrumHit[] {
  if (style === 'none') return []
  const groove = GROOVES[style]
  const position = ((eighth % groove.length) + groove.length) % groove.length
  const hits: DrumHit[] = []
  for (const part of ['kick', 'snare', 'rim', 'hat'] as DrumPart[]) {
    if (!groove.hits[part]?.includes(position)) continue
    const accent = part !== 'hat' || !groove.accents || groove.accents.includes(position)
    hits.push({ part, velocity: part === 'hat' ? (accent ? 0.55 : 0.32) : part === 'kick' ? 0.95 : 0.8 })
  }
  return hits
}

/** The bass register: the chord's bass note between E1 and D#2, where a bass guitar sits. */
export function bassMidi(pc: number): number {
  return 28 + ((((pc - 4) % 12) + 12) % 12)
}

export interface BassNote {
  /** Eighth within the step. */
  eighth: number
  midi: number
  /** In eighths. */
  length: number
}

/** The bass line under one chord lasting `eighths` eighth notes. */
export function bassLine(style: BackingStyle, eighths: number, bassPc: number): BassNote[] {
  if (style === 'none' || eighths <= 0) return []
  const root = bassMidi(bassPc)
  const fifth = root + 7
  const octave = root + 12
  const pattern: Array<[number, number, number]> =
    style === 'pop'
      ? [[0, root, 2], [2, root, 2], [4, root, 2], [6, fifth, 2]]
      : style === 'ballad'
        ? [[0, root, 4], [4, fifth, 3], [7, octave, 1]]
        : style === 'rock'
          ? [0, 1, 2, 3, 4, 5, 6, 7].map((eighth) => [eighth, root, 1] as [number, number, number])
          : [[0, root, 3], [3, fifth, 1], [4, fifth, 3], [7, root, 1]]
  const notes: BassNote[] = []
  for (let start = 0; start < eighths; start += 8) {
    for (const [eighth, midi, length] of pattern) {
      const at = start + eighth
      if (at < eighths) notes.push({ eighth: at, midi, length: Math.min(length, eighths - at) })
    }
  }
  return notes
}
