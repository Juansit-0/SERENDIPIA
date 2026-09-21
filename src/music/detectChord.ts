import { Quality, QUALITY_LIST, chordTones, essentialTones } from './chords'
import { STANDARD_TUNING } from './voicings'
import { pitchName, latinName, chordAccidental, bothNames } from './notes'

export interface DetectionCandidate {
  rootPc: number
  quality: Quality
  anglo: string
  latin: string
  bassPc: number | null
  bassIsRoot: boolean
  inversion: number
  score: number
  matched: number[]
  missing: number[]
  extra: number[]
}

export interface DetectionResult {
  midi: number[]
  pcs: number[]
  bassPc: number | null
  notes: Array<{ midi: number; pc: number; anglo: string; latin: string }>
  candidates: DetectionCandidate[]
}

export function soundingMidi(frets: (number | null)[], tuning: number[] = STANDARD_TUNING): number[] {
  const midi: number[] = []
  for (let i = 0; i < frets.length; i += 1) {
    const fret = frets[i]
    if (fret !== null) midi.push(tuning[i] + fret)
  }
  return midi
}

export function detectChord(frets: (number | null)[], tuning: number[] = STANDARD_TUNING): DetectionResult {
  const midi = soundingMidi(frets, tuning)
  const pcs = [...new Set(midi.map((note) => ((note % 12) + 12) % 12))]
  const bassPc = midi.length > 0 ? ((midi[0] % 12) + 12) % 12 : null

  const notes = midi.map((note) => {
    const pc = ((note % 12) + 12) % 12
    const accidental = chordAccidental(pc)
    return { midi: note, pc, ...bothNames(pc, accidental) }
  })

  if (pcs.length < 2) {
    return { midi, pcs, bassPc, notes, candidates: [] }
  }

  const candidates: DetectionCandidate[] = []

  for (let rootPc = 0; rootPc < 12; rootPc += 1) {
    for (const quality of QUALITY_LIST) {
      const tones = chordTones(rootPc, quality)
      const toneSet = new Set(tones)
      const essential = essentialTones(rootPc, quality)
      if (!essential.every((pc) => pcs.includes(pc))) continue

      const matched = tones.filter((pc) => pcs.includes(pc))
      const missing = tones.filter((pc) => !pcs.includes(pc))
      const extra = pcs.filter((pc) => !toneSet.has(pc))
      if (extra.length > 2) continue
      if (matched.length < 2) continue

      const bassIsRoot = bassPc === rootPc
      let score = matched.length * 6
      score -= missing.length * 2.5
      score -= extra.length * 5
      score += bassIsRoot ? 8 : 0
      if (pcs.length >= 3) score += 2
      if (quality.family === 'triad' && pcs.length === 3) score += 2
      if (quality.intervals.length > 5 && pcs.length < 4) score -= 4

      const inversion = bassPc !== null ? tones.indexOf(bassPc) : -1
      const accidental = chordAccidental(rootPc)
      const bassAccidental = bassPc !== null ? chordAccidental(bassPc) : accidental

      candidates.push({
        rootPc,
        quality,
        anglo:
          bassPc !== null && !bassIsRoot
            ? `${pitchName(rootPc, accidental)}${quality.suffix}/${pitchName(bassPc, bassAccidental)}`
            : `${pitchName(rootPc, accidental)}${quality.suffix}`,
        latin:
          bassPc !== null && !bassIsRoot
            ? `${latinName(rootPc, accidental)}${quality.suffix === '' ? '' : ` ${quality.suffix}`}/${latinName(bassPc, bassAccidental)}`
            : `${latinName(rootPc, accidental)}${quality.suffix === '' ? '' : ` ${quality.suffix}`}`,
        bassPc,
        bassIsRoot,
        inversion: inversion >= 0 ? inversion : 0,
        score,
        matched,
        missing,
        extra,
      })
    }
  }

  candidates.sort((a, b) => b.score - a.score)

  const seen = new Set<string>()
  const deduped: DetectionCandidate[] = []
  for (const candidate of candidates) {
    const key = candidate.anglo
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(candidate)
    if (deduped.length >= 6) break
  }

  return { midi, pcs, bassPc, notes, candidates: deduped }
}
