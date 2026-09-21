import { qualityById, type QualityId } from './chords'
import { chordAccidental, latinName, pitchName } from './notes'
import { formatChord, latinSuffix, type ParsedChord } from './parseChord'

export const MAX_CAPO = 7

function mod12(value: number): number {
  return ((value % 12) + 12) % 12
}

export function clampCapo(capo: number): number {
  if (!Number.isFinite(capo)) return 0
  return Math.min(MAX_CAPO, Math.max(0, Math.round(capo)))
}

export function withCapo(tuning: number[], capo: number): number[] {
  const clamped = clampCapo(capo)
  return tuning.map((midi) => midi + clamped)
}

export interface ChordLabels {
  anglo: string
  latin: string
}

export function transposeLabels(
  rootPc: number,
  qualityId: QualityId,
  bassPc: number | null,
  semitones: number,
): ChordLabels {
  return formatChord(mod12(rootPc + semitones), qualityId, {
    accidental: chordAccidental(mod12(rootPc + semitones)),
    bassPc: bassPc === null ? null : mod12(bassPc + semitones),
  })
}

export function transposeChord(chord: ParsedChord, semitones: number): ParsedChord {
  const rootPc = mod12(chord.rootPc + semitones)
  const bassPc = chord.bassPc === null ? null : mod12(chord.bassPc + semitones)
  const accidental = chordAccidental(rootPc)
  const bassAccidental = bassPc !== null ? chordAccidental(bassPc) : accidental
  const labels = formatChord(rootPc, chord.quality.id, { accidental, bassPc })
  return {
    rootPc,
    quality: chord.quality,
    bassPc,
    accidental,
    anglo: labels.anglo,
    latin: labels.latin,
    bassAnglo: bassPc !== null ? pitchName(bassPc, bassAccidental) : null,
    bassLatin: bassPc !== null ? latinName(bassPc, bassAccidental) : null,
  }
}

export function soundingChord(chord: ParsedChord, capo: number): ParsedChord {
  return transposeChord(chord, clampCapo(capo))
}

export function shapeChord(sounding: ParsedChord, capo: number): ParsedChord {
  return transposeChord(sounding, -clampCapo(capo))
}

export function qualitySuffix(qualityId: QualityId): string {
  return latinSuffix(qualityById(qualityId).suffix)
}
