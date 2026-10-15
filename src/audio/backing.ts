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

/**
 * The kit: `ghost` is a soft snare, `rim` the side stick, `brush` the brushed snare, `open` the open hi-hat
 * (the next closed hat chokes it) and `brushHat` the hat played with brushes.
 */
export type DrumPart = 'kick' | 'snare' | 'ghost' | 'rim' | 'brush' | 'hat' | 'open' | 'brushHat'

const PART_ORDER: DrumPart[] = ['kick', 'snare', 'ghost', 'rim', 'brush', 'hat', 'open', 'brushHat']

export interface Groove {
  /** Eighths in one cycle of the groove (8 = one bar of 4/4, 16 = two bars). */
  length: number
  hits: Partial<Record<DrumPart, number[]>>
  /** Eighths (within the cycle) played harder on the hi-hat. */
  accents?: number[]
}

const EVERY = (length: number, except: number[] = []) => Array.from({ length }, (_, i) => i).filter((i) => !except.includes(i))

export const GROOVES: Record<Exclude<BackingStyle, 'none'>, Groove> = {
  // Kick on 1 and 3 (and the «and» of 3), snare on 2 and 4, eighths on the hat; the hat opens at the end of every second bar.
  pop: {
    length: 16,
    hits: { kick: [0, 4, 5, 8, 12, 13], snare: [2, 6, 10, 14], ghost: [11], hat: EVERY(16, [15]), open: [15] },
    accents: [0, 2, 4, 6, 8, 10, 12, 14],
  },
  // Half-time: kick on 1, side stick on 3, soft quarter hats with a passing eighth.
  ballad: { length: 8, hits: { kick: [0, 5], rim: [4], hat: [0, 2, 4, 6, 7] }, accents: [0, 4] },
  // Driving: kick on 1, the «and» of 2, and 3; snare 2 and 4; hard eighths and an open hat into the next phrase.
  rock: {
    length: 16,
    hits: { kick: [0, 3, 4, 8, 11, 12, 13], snare: [2, 6, 10, 14], hat: EVERY(16, [15]), open: [15] },
    accents: EVERY(16),
  },
  // Two bars: kick on 1 and the «and» of 2 each bar, side stick on the bossa clave, brushed eighths on the hat.
  bossa: { length: 16, hits: { kick: [0, 3, 4, 7, 8, 11, 12, 15], rim: [0, 3, 6, 10, 12], brushHat: EVERY(16) }, accents: [0, 4, 8, 12] },
}

export interface DrumHit {
  part: DrumPart
  /** 0–1. */
  velocity: number
}

const VELOCITY: Record<DrumPart, number> = { kick: 0.9, snare: 0.85, ghost: 0.3, rim: 0.7, brush: 0.7, hat: 0.45, open: 0.6, brushHat: 0.5 }

/** The drum hits on one eighth of the running groove (`eighth` counts from the start of playback). */
export function drumsAt(style: BackingStyle, eighth: number): DrumHit[] {
  if (style === 'none') return []
  const groove = GROOVES[style]
  const position = ((eighth % groove.length) + groove.length) % groove.length
  const hits: DrumHit[] = []
  for (const part of PART_ORDER) {
    if (!groove.hits[part]?.includes(position)) continue
    const accented = !groove.accents || groove.accents.includes(position)
    const velocity = part === 'hat' || part === 'brushHat' ? (accented ? VELOCITY[part] + 0.3 : VELOCITY[part]) : VELOCITY[part]
    // Ballads and bossa sit back: the whole kit plays softer.
    hits.push({ part, velocity: style === 'ballad' || style === 'bossa' ? velocity * 0.8 : velocity })
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

/** The note of `pc` nearest to `from` (within a tritone). */
function nearest(pc: number, from: number): number {
  const up = (((pc - from) % 12) + 12) % 12
  return up <= 6 ? from + up : from + up - 12
}

/**
 * The bass line under one chord lasting `eighths` eighth notes. When the next chord's bass is known and different,
 * the last eighth walks into it a semitone away, the way a bass player leads the ear to the change.
 */
export function bassLine(style: BackingStyle, eighths: number, bassPc: number, nextPc: number | null = null): BassNote[] {
  if (style === 'none' || eighths <= 0) return []
  const root = bassMidi(bassPc)
  const fifth = root + 7
  const octave = root + 12
  const pattern: Array<[number, number, number]> =
    style === 'pop'
      ? [
          [0, root, 3],
          [3, root, 1],
          [4, root, 2],
          [6, fifth, 1],
          [7, octave, 1],
        ]
      : style === 'ballad'
        ? [
            [0, root, 4],
            [4, fifth, 3],
            [7, octave, 1],
          ]
        : style === 'rock'
          ? [0, 1, 2, 3, 4, 5, 6, 7].map((eighth) => [eighth, root, 1] as [number, number, number])
          : [
              [0, root, 3],
              [3, fifth, 1],
              [4, fifth, 3],
              [7, root, 1],
            ]
  const notes: BassNote[] = []
  for (let start = 0; start < eighths; start += 8) {
    for (const [eighth, midi, length] of pattern) {
      const at = start + eighth
      if (at < eighths) notes.push({ eighth: at, midi, length: Math.min(length, eighths - at) })
    }
  }
  if (nextPc !== null && nextPc !== bassPc && eighths >= 2) {
    const last = eighths - 1
    const kept = notes.filter((note) => note.eighth < last).map((note) => ({ ...note, length: Math.min(note.length, last - note.eighth) }))
    // Never below the bass's low E.
    const near = nearest(nextPc, root)
    const target = near < 28 ? near + 12 : near
    return [...kept, { eighth: last, midi: target > root ? target - 1 : target + 1, length: 1 }]
  }
  return notes
}
