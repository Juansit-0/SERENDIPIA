import { QualityId, qualityById } from './chords'
import { STANDARD_TUNING, Voicing, voicingsFor } from './voicings'

export type StepVoicingSource = 'marked' | 'proof' | 'auto'

export interface StepVoicingRef {
  frets: (number | null)[]
  label: string
  source: StepVoicingSource
}

export function voicingSignature(frets: (number | null)[]): string {
  return frets.map((fret) => (fret === null ? 'x' : String(fret))).join(',')
}

export function voicingLabel(frets: (number | null)[]): string {
  return frets.map((fret) => (fret === null ? 'x' : String(fret))).join(' ')
}

export function voicingSpan(frets: (number | null)[]): number {
  const fretted = frets.filter((fret): fret is number => fret !== null && fret > 0)
  if (fretted.length === 0) return 0
  return Math.max(...fretted) - Math.min(...fretted)
}

export function isPlayableFrets(frets: (number | null)[]): boolean {
  const sounding = frets.filter((fret) => fret !== null).length
  if (sounding < 2) return false
  if (frets.some((fret) => fret !== null && fret < 0)) return false
  return voicingSpan(frets) <= 5
}

export function autoVoicing(
  rootPc: number,
  qualityId: QualityId,
  tuning: number[] = STANDARD_TUNING,
  bassPc: number | null = null,
): Voicing | null {
  return voicingsFor(rootPc, qualityById(qualityId), tuning, { limit: 1, bassPc })[0] ?? null
}

export function resolveStepFrets(
  step: {
    frets?: (number | null)[] | null
    rootPc: number
    qualityId: QualityId
    bassPc?: number | null
  },
  tuning: number[] = STANDARD_TUNING,
): (number | null)[] | null {
  if (step.frets && isPlayableFrets(step.frets)) return step.frets
  return autoVoicing(step.rootPc, step.qualityId, tuning, step.bassPc ?? null)?.frets ?? null
}

export function findVoicingIndex(voicings: Voicing[], frets: (number | null)[] | null | undefined): number {
  if (!frets) return -1
  const signature = voicingSignature(frets)
  return voicings.findIndex((voicing) => voicing.signature === signature)
}

export function absoluteLabel(frets: (number | null)[], capo: number): string {
  return frets
    .map((fret) => {
      if (fret === null) return 'x'
      if (fret === 0) return capo > 0 ? String(capo) : '0'
      return String(fret + capo)
    })
    .join(' ')
}
