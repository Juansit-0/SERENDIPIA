import { QualityId, qualityById } from './chords'
import { keyAccidental, spelledScale } from './notes'
import { latinSuffix } from './parseChord'

export type Mode = 'major' | 'minor'
export type HarmonicFunction = 'tonic' | 'subdominant' | 'dominant'

export const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]
export const NATURAL_MINOR = [0, 2, 3, 5, 7, 8, 10]

export interface DiatonicChord {
  degree: number
  roman: string
  rootPc: number
  qualityId: QualityId
  harmonicFunction: HarmonicFunction
  anglo: string
  latin: string
}

const MAJOR_TRIADS: QualityId[] = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim']
const MAJOR_TRIAD_ROMANS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
const MAJOR_SEVENTHS: QualityId[] = ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5']
const MAJOR_SEVENTH_ROMANS = ['Imaj7', 'ii7', 'iii7', 'IVmaj7', 'V7', 'vi7', 'viiø7']
const MINOR_TRIADS: QualityId[] = ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj']
const MINOR_TRIAD_ROMANS = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII']
const MINOR_SEVENTHS: QualityId[] = ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7']
const MINOR_SEVENTH_ROMANS = ['i7', 'iiø7', 'IIImaj7', 'iv7', 'v7', 'VImaj7', 'VII7']
const MAJOR_FUNCTIONS: HarmonicFunction[] = [
  'tonic',
  'subdominant',
  'tonic',
  'subdominant',
  'dominant',
  'tonic',
  'dominant',
]
const MINOR_FUNCTIONS: HarmonicFunction[] = [
  'tonic',
  'subdominant',
  'tonic',
  'subdominant',
  'dominant',
  'subdominant',
  'dominant',
]

export function scalePcs(rootPc: number, mode: Mode): number[] {
  const steps = mode === 'major' ? MAJOR_SCALE : NATURAL_MINOR
  return steps.map((step) => (((rootPc + step) % 12) + 12) % 12)
}

export function diatonicChords(rootPc: number, mode: Mode, sevenths = false): DiatonicChord[] {
  const degrees = scalePcs(rootPc, mode)
  const spelled = spelledScale(rootPc, mode === 'major' ? MAJOR_SCALE : NATURAL_MINOR, keyAccidental(rootPc, mode) === 'flat')
  const qualities = mode === 'major' ? (sevenths ? MAJOR_SEVENTHS : MAJOR_TRIADS) : sevenths ? MINOR_SEVENTHS : MINOR_TRIADS
  const romans = mode === 'major' ? (sevenths ? MAJOR_SEVENTH_ROMANS : MAJOR_TRIAD_ROMANS) : sevenths ? MINOR_SEVENTH_ROMANS : MINOR_TRIAD_ROMANS
  const functions = mode === 'major' ? MAJOR_FUNCTIONS : MINOR_FUNCTIONS

  return degrees.map((degreePc, index) => {
    const quality = qualityById(qualities[index])
    return {
      degree: index,
      roman: romans[index],
      rootPc: degreePc,
      qualityId: qualities[index],
      harmonicFunction: functions[index],
      anglo: `${spelled[index].anglo}${quality.suffix}`,
      latin: `${spelled[index].latin}${latinSuffix(quality.suffix)}`,
    }
  })
}

export function functionLabelKey(fn: HarmonicFunction): 'theory.function.tonic' | 'theory.function.subdominant' | 'theory.function.dominant' {
  if (fn === 'tonic') return 'theory.function.tonic'
  if (fn === 'subdominant') return 'theory.function.subdominant'
  return 'theory.function.dominant'
}
