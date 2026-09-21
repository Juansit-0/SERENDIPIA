import { QualityId, qualityById } from './chords'
import { keyAccidental, spelledScale } from './notes'
import { latinSuffix } from './parseChord'
import { HarmonicFunction, MAJOR_SCALE, Mode, NATURAL_MINOR, diatonicChords } from './scales'

export interface ProgressionTemplate {
  id: string
  nameEs: string
  nameEn: string
  category: 'pop' | 'rock' | 'jazz' | 'blues' | 'flamenco' | 'classical'
  mode: Mode
  degrees: number[]
  qualities: QualityId[]
  romans: string[]
}

export interface ResolvedStep {
  degree: number
  roman: string
  rootPc: number
  qualityId: QualityId
  anglo: string
  latin: string
}

export const PROGRESSIONS: ProgressionTemplate[] = [
  {
    id: 'pop-1564',
    nameEs: 'Pop I–V–vi–IV',
    nameEn: 'Pop I–V–vi–IV',
    category: 'pop',
    mode: 'major',
    degrees: [0, 4, 5, 3],
    qualities: ['maj', 'maj', 'min', 'maj'],
    romans: ['I', 'V', 'vi', 'IV'],
  },
  {
    id: 'doo-wop',
    nameEs: 'Años 50 I–vi–IV–V',
    nameEn: 'Fifties I–vi–IV–V',
    category: 'pop',
    mode: 'major',
    degrees: [0, 5, 3, 4],
    qualities: ['maj', 'min', 'maj', 'maj'],
    romans: ['I', 'vi', 'IV', 'V'],
  },
  {
    id: 'vi-iv-i-v',
    nameEs: 'Eje emocional vi–IV–I–V',
    nameEn: 'Emotional axis vi–IV–I–V',
    category: 'pop',
    mode: 'major',
    degrees: [5, 3, 0, 4],
    qualities: ['min', 'maj', 'maj', 'maj'],
    romans: ['vi', 'IV', 'I', 'V'],
  },
  {
    id: 'i-iv-v',
    nameEs: 'Tres acordes I–IV–V',
    nameEn: 'Three chords I–IV–V',
    category: 'rock',
    mode: 'major',
    degrees: [0, 3, 4],
    qualities: ['maj', 'maj', 'maj'],
    romans: ['I', 'IV', 'V'],
  },
  {
    id: 'rock-bvii',
    nameEs: 'Rock mixolidio I–♭VII–IV',
    nameEn: 'Mixolydian rock I–♭VII–IV',
    category: 'rock',
    mode: 'major',
    degrees: [0, 6, 3],
    qualities: ['maj', 'maj', 'maj'],
    romans: ['I', '♭VII', 'IV'],
  },
  {
    id: 'andalusian',
    nameEs: 'Cadencia andaluza i–♭VII–♭VI–V',
    nameEn: 'Andalusian cadence i–♭VII–♭VI–V',
    category: 'flamenco',
    mode: 'minor',
    degrees: [0, 6, 5, 4],
    qualities: ['min', 'maj', 'maj', 'maj'],
    romans: ['i', '♭VII', '♭VI', 'V'],
  },
  {
    id: 'flamenco-i-iv-v',
    nameEs: 'Flamenco i–iv–V',
    nameEn: 'Flamenco i–iv–V',
    category: 'flamenco',
    mode: 'minor',
    degrees: [0, 3, 4],
    qualities: ['min', 'min', 'maj'],
    romans: ['i', 'iv', 'V'],
  },
  {
    id: 'ii-v-i',
    nameEs: 'Jazz ii–V–I',
    nameEn: 'Jazz ii–V–I',
    category: 'jazz',
    mode: 'major',
    degrees: [1, 4, 0],
    qualities: ['m7', '7', 'maj7'],
    romans: ['ii7', 'V7', 'Imaj7'],
  },
  {
    id: 'i-vi-ii-v',
    nameEs: 'Turnaround I–vi–ii–V',
    nameEn: 'Turnaround I–vi–ii–V',
    category: 'jazz',
    mode: 'major',
    degrees: [0, 5, 1, 4],
    qualities: ['maj7', 'm7', 'm7', '7'],
    romans: ['Imaj7', 'vi7', 'ii7', 'V7'],
  },
  {
    id: 'blues-12',
    nameEs: 'Blues de 12 compases',
    nameEn: 'Twelve-bar blues',
    category: 'blues',
    mode: 'major',
    degrees: [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4],
    qualities: ['7', '7', '7', '7', '7', '7', '7', '7', '7', '7', '7', '7'],
    romans: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'],
  },
  {
    id: 'pachelbel',
    nameEs: 'Canon de Pachelbel',
    nameEn: 'Pachelbel’s Canon',
    category: 'classical',
    mode: 'major',
    degrees: [0, 4, 5, 2, 3, 0, 3, 4],
    qualities: ['maj', 'maj', 'min', 'min', 'maj', 'maj', 'maj', 'maj'],
    romans: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'],
  },
]

export function resolveProgression(template: ProgressionTemplate, rootPc: number): ResolvedStep[] {
  const spelled = spelledScale(rootPc, template.mode === 'major' ? MAJOR_SCALE : NATURAL_MINOR, keyAccidental(rootPc, template.mode) === 'flat')
  return template.degrees.map((degree, index) => {
    const note = spelled[degree]
    const quality = qualityById(template.qualities[index])
    return {
      degree,
      roman: template.romans[index],
      rootPc: note.pc,
      qualityId: template.qualities[index],
      anglo: `${note.anglo}${quality.suffix}`,
      latin: `${note.latin}${latinSuffix(quality.suffix)}`,
    }
  })
}

export interface Suggestion {
  rootPc: number
  qualityId: QualityId
  anglo: string
  latin: string
  reasonEs: string
  reasonEn: string
  weight: number
  roman: string | null
}

const RELATION_REASONS: Record<string, { es: string; en: string; weight: number }> = {
  'dominant>tonic': {
    es: 'Cadencia auténtica: la resolución más fuerte',
    en: 'Authentic cadence: the strongest resolution',
    weight: 1,
  },
  'dominant>subdominant': {
    es: 'Cadencia rota: la tensión se desvía',
    en: 'Deceptive move: the tension sidesteps',
    weight: 0.55,
  },
  'subdominant>dominant': {
    es: 'Prepara la cadencia: subdominante hacia dominante',
    en: 'Sets up the cadence: subdominant to dominant',
    weight: 0.9,
  },
  'subdominant>tonic': {
    es: 'Reposo: la subdominante vuelve a casa',
    en: 'Rest: the subdominant returns home',
    weight: 0.75,
  },
  'tonic>subdominant': {
    es: 'Abre la frase: la tónica se aleja',
    en: 'Opens the phrase: the tonic moves away',
    weight: 0.8,
  },
  'tonic>dominant': {
    es: 'Tensión directa desde la tónica',
    en: 'Direct tension from the tonic',
    weight: 0.7,
  },
  'tonic>tonic': {
    es: 'Continuidad: mismo centro tonal',
    en: 'Continuity: same tonal center',
    weight: 0.5,
  },
}

export function nextChordSuggestions(
  currentRootPc: number,
  keyRootPc: number,
  mode: Mode,
): Suggestion[] {
  const diatonic = diatonicChords(keyRootPc, mode)
  const spelled = spelledScale(keyRootPc, mode === 'major' ? MAJOR_SCALE : NATURAL_MINOR, keyAccidental(keyRootPc, mode) === 'flat')
  const currentDegree = diatonic.find((chord) => chord.rootPc === currentRootPc)
  const suggestions: Suggestion[] = []

  const push = (
    rootPc: number,
    qualityId: QualityId,
    roman: string | null,
    reason: { es: string; en: string; weight: number },
    anglo: string,
    latin: string,
  ) => {
    if (rootPc === currentRootPc) return
    suggestions.push({
      rootPc,
      qualityId,
      roman,
      anglo,
      latin,
      reasonEs: reason.es,
      reasonEn: reason.en,
      weight: reason.weight,
    })
  }

  if (currentDegree) {
    const fromFunction: HarmonicFunction = currentDegree.harmonicFunction
    for (const target of diatonic) {
      if (target.rootPc === currentRootPc) continue
      const reason = RELATION_REASONS[`${fromFunction}>${target.harmonicFunction}`]
      if (!reason) continue
      let weight = reason.weight
      if (target.harmonicFunction === 'tonic' && fromFunction === 'dominant') weight += 0.1
      if (target.rootPc === (currentRootPc + 9) % 12) {
        push(
          target.rootPc,
          target.qualityId,
          target.roman,
          {
            es: 'Relativo: comparte dos notas con el acorde actual',
            en: 'Relative: shares two notes with the current chord',
            weight: weight * 0.95 + 0.05,
          },
          target.anglo,
          target.latin,
        )
        continue
      }
      push(target.rootPc, target.qualityId, target.roman, { es: reason.es, en: reason.en, weight }, target.anglo, target.latin)
    }

    const relative = (currentRootPc + 3) % 12
    const relativeChord = diatonic.find((chord) => chord.rootPc === relative)
    if (relativeChord) {
      push(
        relativeChord.rootPc,
        relativeChord.qualityId,
        relativeChord.roman,
        {
          es: 'Relativo mayor: cambia el color sin salir de la tonalidad',
          en: 'Relative major: changes color without leaving the key',
          weight: 0.65,
        },
        relativeChord.anglo,
        relativeChord.latin,
      )
    }
  } else {
    for (const target of diatonic) {
      push(
        target.rootPc,
        target.qualityId,
        target.roman,
        {
          es: 'Grado diatónico: encaja en la tonalidad',
          en: 'Diatonic degree: fits the key',
          weight: 0.6,
        },
        target.anglo,
        target.latin,
      )
    }
  }

  const dominantSeventh = (keyRootPc + 7) % 12
  push(
    dominantSeventh,
    '7',
    'V7',
    {
      es: 'Dominante: máxima tensión hacia la tónica',
      en: 'Dominant: maximum tension toward the tonic',
      weight: 0.85,
    },
    `${spelled[4].anglo}7`,
    `${spelled[4].latin} 7`,
  )

  if (mode === 'major') {
    const relativeMinor = (keyRootPc + 9) % 12
    push(
      relativeMinor,
      'min',
      'vi',
      {
        es: 'Relativo menor: oscurece la tónica',
        en: 'Relative minor: darkens the tonic',
        weight: 0.6,
      },
      `${spelled[5].anglo}m`,
      `${spelled[5].latin} m`,
    )
  }

  suggestions.sort((a, b) => b.weight - a.weight)
  const seen = new Set<string>()
  const deduped: Suggestion[] = []
  for (const suggestion of suggestions) {
    if (seen.has(suggestion.anglo)) continue
    seen.add(suggestion.anglo)
    deduped.push(suggestion)
    if (deduped.length >= 5) break
  }
  return deduped
}
