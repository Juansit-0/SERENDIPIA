import { QualityId, qualityById } from './chords'
import { keyAccidental, latinName, pitchName } from './notes'
import { diatonicChords, type HarmonicFunction, type Mode } from './scales'

export interface KeyCandidate {
  rootPc: number
  mode: Mode
  score: number
  roman: string
  harmonicFunction: HarmonicFunction | null
  keyAnglo: string
  keyLatin: string
}

const FUNCTION_WEIGHT: Record<HarmonicFunction, number> = {
  tonic: 2.5,
  dominant: 1.8,
  subdominant: 1.2,
}

const MODES: Mode[] = ['major', 'minor']

export function keyCandidates(chord: { rootPc: number; qualityId: QualityId }, limit = 3): KeyCandidate[] {
  const candidates: KeyCandidate[] = []

  for (let rootPc = 0; rootPc < 12; rootPc += 1) {
    for (const mode of MODES) {
      const triads = diatonicChords(rootPc, mode)
      const sevenths = diatonicChords(rootPc, mode, true)
      const triad = triads.find((degree) => degree.rootPc === chord.rootPc)
      const seventh = sevenths.find((degree) => degree.rootPc === chord.rootPc)

      const isExtended = qualityById(chord.qualityId).intervals.length >= 4
      let score = 0
      let roman = ''
      let harmonicFunction: HarmonicFunction | null = null
      let qualityMatched = false

      if (triad && triad.qualityId === chord.qualityId) {
        score += 6
        roman = triad.roman
        harmonicFunction = triad.harmonicFunction
        qualityMatched = true
      } else if (seventh && seventh.qualityId === chord.qualityId) {
        score += 5
        roman = seventh.roman
        harmonicFunction = seventh.harmonicFunction
        qualityMatched = true
      } else if (triad) {
        score += isExtended ? 1.5 : 2.5
        roman = triad.roman
        harmonicFunction = triad.harmonicFunction
      } else if (seventh) {
        score += isExtended ? 1 : 1.5
        roman = seventh.roman
        harmonicFunction = seventh.harmonicFunction
      } else {
        continue
      }

      if (harmonicFunction) score += FUNCTION_WEIGHT[harmonicFunction]
      if (chord.rootPc === rootPc && (qualityMatched || !isExtended)) score += 1.5
      if (chord.qualityId === '7' && triad?.roman === 'V') score += 1.5
      if (mode === 'minor' && qualityById(chord.qualityId).family === 'triad' && chord.qualityId === 'maj') score -= 0.8

      const accidental = keyAccidental(rootPc, mode)
      const name = pitchName(rootPc, accidental)
      const latin = latinName(rootPc, accidental)
      candidates.push({
        rootPc,
        mode,
        score,
        roman,
        harmonicFunction,
        keyAnglo: name,
        keyLatin: latin,
      })
    }
  }

  candidates.sort((a, b) => b.score - a.score)
  return candidates.slice(0, limit)
}

export function sameKey(a: { rootPc: number; mode: Mode }, b: { rootPc: number; mode: Mode }): boolean {
  return a.rootPc === b.rootPc && a.mode === b.mode
}
