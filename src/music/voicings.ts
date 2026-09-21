import { Quality, chordTones, essentialTones } from './chords'

export const STANDARD_TUNING = [40, 45, 50, 55, 59, 64]
export const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e']

export interface Tuning {
  id: string
  name: string
  midi: number[]
}

export const TUNINGS: Tuning[] = [
  { id: 'standard', name: 'Estándar (E A D G B e)', midi: STANDARD_TUNING },
  { id: 'drop-d', name: 'Drop D (D A D G B e)', midi: [38, 45, 50, 55, 59, 64] },
  { id: 'half-step', name: 'Medio tono abajo (E♭ A♭ D♭ G♭ B♭ e♭)', midi: [39, 44, 49, 54, 58, 63] },
  { id: 'open-g', name: 'Open G (D G D G B D)', midi: [38, 43, 50, 55, 59, 62] },
]

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Barre {
  fret: number
  from: number
  to: number
}

export interface Voicing {
  frets: (number | null)[]
  midi: number[]
  fingers: (number | null)[]
  barre: Barre | null
  baseFret: number
  span: number
  muted: number
  open: number
  difficulty: Difficulty
  score: number
  source: 'common' | 'generated'
  signature: string
}

export interface VoicingOptions {
  maxFret?: number
  maxSpan?: number
  minNotes?: number
  limit?: number
  bassPc?: number | null
}

const COMMON: Record<string, (number | null)[][]> = {
  '0:maj': [[-1, 3, 2, 0, 1, 0], [-1, -1, 3, 2, 1, 1], [-1, 3, 5, 5, 5, 3]],
  '0:min': [[-1, 3, 5, 5, 4, 3], [-1, 3, 1, 0, 1, 3]],
  '0:7': [[-1, 3, 2, 3, 1, 0]],
  '0:maj7': [[-1, 3, 2, 0, 0, 0], [-1, 3, 5, 4, 5, 3]],
  '0:m7': [[-1, 3, 5, 3, 4, 3]],
  '0:6': [[-1, 3, 2, 2, 1, 0]],
  '0:add9': [[-1, 3, 2, 0, 3, 0]],
  '0:maj9': [[-1, 3, 2, 4, 3, -1]],
  '2:maj': [[-1, -1, 0, 2, 3, 2], [2, 5, 4, 2, 3, 2]],
  '2:min': [[-1, -1, 0, 2, 3, 1]],
  '2:7': [[-1, -1, 0, 2, 1, 2]],
  '2:maj7': [[-1, -1, 0, 2, 2, 2]],
  '2:m7': [[-1, -1, 0, 2, 1, 1]],
  '2:6': [[-1, -1, 0, 2, 0, 2]],
  '2:sus2': [[-1, -1, 0, 2, 3, 0]],
  '2:sus4': [[-1, -1, 0, 2, 3, 3]],
  '4:maj': [[0, 2, 2, 1, 0, 0], [-1, 7, 6, 4, 5, 4]],
  '4:min': [[0, 2, 2, 0, 0, 0], [0, 2, 2, 0, 0, 3]],
  '4:7': [[0, 2, 0, 1, 0, 0], [0, 2, 2, 1, 3, 0]],
  '4:maj7': [[0, 2, 1, 1, 0, 0]],
  '4:m7': [[0, 2, 0, 0, 0, 0], [0, 2, 2, 0, 3, 0]],
  '4:m6': [[0, 2, 2, 0, 1, 2]],
  '4:9': [[0, 2, 0, 1, 0, 2]],
  '4:sus4': [[0, 2, 2, 2, 0, 0]],
  '5:maj': [[-1, -1, 3, 2, 1, 1], [1, 3, 3, 2, 1, 1]],
  '5:maj7': [[-1, -1, 3, 2, 1, 0]],
  '7:maj': [[3, 2, 0, 0, 0, 3], [3, 2, 0, 0, 3, 3], [3, 5, 5, 4, 3, 3]],
  '7:min': [[3, 5, 5, 3, 3, 3]],
  '7:7': [[3, 2, 0, 0, 0, 1], [3, 5, 3, 4, 3, 3]],
  '7:maj7': [[3, 2, 0, 0, 0, 2], [3, 5, 4, 4, 3, 3]],
  '7:m7': [[3, 5, 3, 3, 3, 3]],
  '7:6': [[3, 2, 0, 0, 0, 0]],
  '7:add9': [[3, 0, 0, 2, 0, 3]],
  '9:maj': [[-1, 0, 2, 2, 2, 0], [5, 7, 7, 6, 5, 5]],
  '9:min': [[-1, 0, 2, 2, 1, 0], [5, 7, 7, 5, 5, 5]],
  '9:7': [[-1, 0, 2, 0, 2, 0]],
  '9:maj7': [[-1, 0, 2, 1, 2, 0]],
  '9:m7': [[-1, 0, 2, 0, 1, 0]],
  '9:m6': [[-1, 0, 2, 2, 1, 2]],
  '9:m9': [[-1, 0, 2, 4, 1, 3]],
  '9:sus4': [[-1, 0, 2, 2, 3, 0]],
  '9:7sus4': [[-1, 0, 2, 0, 3, 0]],
  '11:maj': [[-1, 2, 4, 4, 4, 2], [7, 9, 9, 8, 7, 7]],
  '11:min': [[-1, 2, 4, 4, 3, 2], [7, 9, 9, 7, 7, 7]],
  '11:7': [[-1, 2, 1, 2, 0, 2], [7, 9, 7, 8, 7, 7]],
  '11:maj7': [[-1, 2, 4, 3, 4, 2]],
  '11:m7': [[-1, 2, 0, 2, 0, 2], [7, 9, 7, 7, 7, 7]],
  '11:m7b5': [[-1, 2, 3, 2, 3, -1]],
  '11:dim7': [[-1, 2, 3, 4, 3, -1]],
  '1:maj7': [[-1, 4, 6, 5, 6, 4]],
  '1:m7': [[-1, 4, 6, 4, 5, 4]],
  '6:maj': [[2, 4, 4, 3, 2, 2]],
  '6:min': [[2, 4, 4, 2, 2, 2]],
  '6:m7': [[2, 4, 2, 2, 2, 2]],
  '6:m7b5': [[2, 3, 4, 2, 4, -1]],
  '8:maj': [[4, 6, 6, 5, 4, 4]],
  '8:min': [[4, 6, 6, 4, 4, 4]],
  '8:7': [[4, 6, 4, 5, 4, 4]],
  '8:maj7': [[4, 6, 5, 5, 4, 4]],
  '8:m7': [[4, 6, 4, 4, 4, 4]],
  '3:maj': [[-1, 6, 5, 3, 4, 3]],
  '3:maj7': [[-1, 6, 5, 4, 4, 3]],
  '3:m7': [[-1, 6, 5, 3, 4, 3]],
  '3:min': [[-1, 6, 5, 3, 4, -1]],
  '10:maj': [[-1, 1, 3, 3, 3, 1]],
  '10:7': [[-1, 1, 3, 1, 3, 1]],
  '10:m7': [[-1, 1, 3, 1, 2, 1]],
  '10:maj7': [[-1, 1, 3, 2, 3, 1]],
}

function signatureOf(frets: (number | null)[]): string {
  return frets.map((f) => (f === null ? 'x' : String(f))).join(',')
}

function assignFingers(frets: (number | null)[]): { fingers: (number | null)[]; barre: Barre | null } {
  const fingers: (number | null)[] = frets.map(() => null)
  const played = frets
    .map((fret, index) => ({ fret, index }))
    .filter((entry): entry is { fret: number; index: number } => entry.fret !== null && entry.fret > 0)
  if (played.length === 0) return { fingers, barre: null }

  const distinct = [...new Set(played.map((p) => p.fret))].sort((a, b) => a - b)
  const fretToFinger = new Map<number, number>()
  distinct.forEach((fret, index) => fretToFinger.set(fret, Math.min(index + 1, 4)))

  let barre: Barre | null = null
  const lowest = distinct[0]
  const lowestStrings = played.filter((p) => p.fret === lowest).map((p) => p.index)
  if (lowest > 0 && lowestStrings.length >= 2) {
    const from = Math.min(...lowestStrings)
    const to = Math.max(...lowestStrings)
    const openBelow = frets.slice(0, from).some((f) => f === 0)
    if (!openBelow) {
      barre = { fret: lowest, from, to }
      for (let i = from; i <= to; i += 1) {
        if (frets[i] === lowest) fingers[i] = 1
      }
    }
  }

  for (const entry of played) {
    if (fingers[entry.index] === null) {
      fingers[entry.index] = fretToFinger.get(entry.fret) ?? 1
    }
  }

  return { fingers, barre }
}

function difficultyOf(barre: Barre | null, span: number, muted: number, distinct: number): Difficulty {
  if (!barre && span <= 3 && muted <= 2) return 'easy'
  if (barre && barre.to - barre.from >= 3) return 'hard'
  if (span >= 5 || distinct >= 5) return 'hard'
  return 'medium'
}

function buildVoicing(
  frets: (number | null)[],
  tuning: number[],
  source: 'common' | 'generated',
  rootPc: number,
  quality: Quality,
  bassPc: number | null,
  chordPcSet: Set<number>,
): Voicing | null {
  const midi: number[] = []
  for (let i = 0; i < frets.length; i += 1) {
    const fret = frets[i]
    if (fret !== null) midi.push(tuning[i] + fret)
  }
  if (midi.length < 2) return null

  const soundingPcs = new Set(midi.map((note) => ((note % 12) + 12) % 12))
  const essential = essentialTones(rootPc, quality)
  if (!essential.every((pc) => soundingPcs.has(pc))) return null

  const bassPitch = midi[0] % 12
  if (bassPc !== null && bassPitch !== bassPc) return null

  const fretted = frets.filter((f): f is number => f !== null)
  const span = fretted.length > 0 ? Math.max(...fretted) - Math.min(...fretted) : 0
  const muted = frets.filter((f) => f === null).length
  const open = frets.filter((f) => f === 0).length
  const distinct = new Set(fretted).size
  const baseFret = fretted.length > 0 ? Math.max(1, Math.min(...fretted)) : 1

  const { fingers, barre } = assignFingers(frets)
  const difficulty = difficultyOf(barre, span, muted, distinct)

  const coverage = [...chordPcSet].filter((pc) => soundingPcs.has(pc)).length / chordPcSet.size
  const bassBonus = bassPitch === rootPc ? 14 : bassPc !== null ? 14 : 0
  let score = 100
  score += open * 6
  score -= muted * 7
  score += bassBonus
  score -= baseFret * 1.5
  score -= span * 2
  score -= distinct * 1
  score += coverage * 8
  if (source === 'common') score += 18
  if (difficulty === 'easy') score += 4
  if (difficulty === 'hard') score -= 6

  return {
    frets: frets.slice(),
    midi,
    fingers,
    barre,
    baseFret,
    span,
    muted,
    open,
    difficulty,
    score,
    source,
    signature: signatureOf(frets),
  }
}

export function voicingsFor(
  rootPc: number,
  quality: Quality,
  tuning: number[] = STANDARD_TUNING,
  options: VoicingOptions = {},
): Voicing[] {
  const chordPcSet = new Set(chordTones(rootPc, quality))
  const maxFret = options.maxFret ?? 12
  const maxSpan = options.maxSpan ?? 4
  const minNotes = options.minNotes ?? (quality.intervals.length >= 5 ? 4 : 3)
  const limit = options.limit ?? 8
  const bassPc = options.bassPc ?? null

  const candidatesPerString = tuning.map((midi) => {
    const list: (number | null)[] = [null]
    for (let fret = 0; fret <= maxFret; fret += 1) {
      if (chordPcSet.has((((midi + fret) % 12) + 12) % 12)) list.push(fret)
    }
    return list
  })

  const results: Voicing[] = []
  const current: (number | null)[] = []

  const walk = (index: number) => {
    if (index === tuning.length) {
      if (current.filter((f) => f !== null).length < minNotes) return
      const voicing = buildVoicing(current, tuning, 'generated', rootPc, quality, bassPc, chordPcSet)
      if (voicing) results.push(voicing)
      return
    }
    for (const fret of candidatesPerString[index]) {
      if (fret !== null) {
        const frettedSoFar = [...current, fret].filter((f): f is number => f !== null)
        if (frettedSoFar.length > 0) {
          const span = Math.max(...frettedSoFar) - Math.min(...frettedSoFar)
          if (span > maxSpan) continue
        }
      }
      current.push(fret)
      walk(index + 1)
      current.pop()
    }
  }

  walk(0)

  const curated: Voicing[] = []
  const curatedFrets = COMMON[`${rootPc}:${quality.id}`]
  if (curatedFrets) {
    for (const raw of curatedFrets) {
      const frets = raw.map((fret) => (fret === -1 ? null : fret))
      const voicing = buildVoicing(frets, tuning, 'common', rootPc, quality, bassPc, chordPcSet)
      if (voicing) curated.push(voicing)
    }
  }

  const seen = new Set<string>()
  const merged: Voicing[] = []
  for (const voicing of [...curated, ...results.sort((a, b) => b.score - a.score)]) {
    if (seen.has(voicing.signature)) continue
    seen.add(voicing.signature)
    merged.push(voicing)
  }

  merged.sort((a, b) => b.score - a.score)
  return merged.slice(0, limit)
}

export function voicingToMidi(voicing: Voicing): number[] {
  return voicing.midi
}
