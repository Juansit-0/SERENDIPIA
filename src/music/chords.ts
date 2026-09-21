import { spellNote, tonicLetterIndex } from './notes'

export type QualityId =
  | 'maj'
  | 'min'
  | 'dim'
  | 'aug'
  | 'sus2'
  | 'sus4'
  | '5'
  | '6'
  | 'm6'
  | '7'
  | 'maj7'
  | 'm7'
  | 'm7b5'
  | 'dim7'
  | 'mMaj7'
  | '7sus4'
  | '7b5'
  | '7#5'
  | 'add9'
  | 'madd9'
  | '9'
  | 'maj9'
  | 'm9'
  | '69'
  | '11'
  | 'm11'
  | '13'
  | 'maj13'
  | 'm13'

export type QualityFamily = 'triad' | 'seventh' | 'extended' | 'suspended' | 'power'

export interface Quality {
  id: QualityId
  suffix: string
  aliases: string[]
  intervals: number[]
  essential: number[]
  nameEs: string
  nameEn: string
  family: QualityFamily
}

export const QUALITY_LIST: Quality[] = [
  { id: 'maj', suffix: '', aliases: ['maj', 'M', 'major', 'mayor', 'Δ'], intervals: [0, 4, 7], essential: [4], nameEs: 'Mayor', nameEn: 'Major', family: 'triad' },
  { id: 'min', suffix: 'm', aliases: ['min', '-', 'minor', 'menor'], intervals: [0, 3, 7], essential: [3], nameEs: 'Menor', nameEn: 'Minor', family: 'triad' },
  { id: 'dim', suffix: 'dim', aliases: ['o', '°', 'disminuido', 'dism'], intervals: [0, 3, 6], essential: [3, 6], nameEs: 'Disminuido', nameEn: 'Diminished', family: 'triad' },
  { id: 'aug', suffix: 'aug', aliases: ['+', 'aumentado'], intervals: [0, 4, 8], essential: [4, 8], nameEs: 'Aumentado', nameEn: 'Augmented', family: 'triad' },
  { id: 'sus2', suffix: 'sus2', aliases: [], intervals: [0, 2, 7], essential: [2], nameEs: 'Suspendido 2', nameEn: 'Suspended 2nd', family: 'suspended' },
  { id: 'sus4', suffix: 'sus4', aliases: ['sus'], intervals: [0, 5, 7], essential: [5], nameEs: 'Suspendido 4', nameEn: 'Suspended 4th', family: 'suspended' },
  { id: '5', suffix: '5', aliases: ['power', 'quinta'], intervals: [0, 7], essential: [7], nameEs: 'Quinta', nameEn: 'Power', family: 'power' },
  { id: '6', suffix: '6', aliases: ['maj6', 'sexta'], intervals: [0, 4, 7, 9], essential: [4, 9], nameEs: 'Sexta', nameEn: 'Sixth', family: 'extended' },
  { id: 'm6', suffix: 'm6', aliases: ['min6', '-6'], intervals: [0, 3, 7, 9], essential: [3, 9], nameEs: 'Menor sexta', nameEn: 'Minor sixth', family: 'extended' },
  { id: '7', suffix: '7', aliases: ['dom7', 'dominante'], intervals: [0, 4, 7, 10], essential: [4, 10], nameEs: 'Séptima', nameEn: 'Dominant seventh', family: 'seventh' },
  { id: 'maj7', suffix: 'maj7', aliases: ['M7', 'Δ7', 'major7', 'mayor7'], intervals: [0, 4, 7, 11], essential: [4, 11], nameEs: 'Mayor séptima', nameEn: 'Major seventh', family: 'seventh' },
  { id: 'm7', suffix: 'm7', aliases: ['min7', '-7'], intervals: [0, 3, 7, 10], essential: [3, 10], nameEs: 'Menor séptima', nameEn: 'Minor seventh', family: 'seventh' },
  { id: 'm7b5', suffix: 'm7b5', aliases: ['ø', 'half-dim', 'semidisminuido', 'm7♭5'], intervals: [0, 3, 6, 10], essential: [3, 6, 10], nameEs: 'Semidisminuido', nameEn: 'Half-diminished', family: 'seventh' },
  { id: 'dim7', suffix: 'dim7', aliases: ['o7', '°7'], intervals: [0, 3, 6, 9], essential: [3, 6, 9], nameEs: 'Disminuido séptima', nameEn: 'Diminished seventh', family: 'seventh' },
  { id: 'mMaj7', suffix: 'mMaj7', aliases: ['mM7', 'minMaj7'], intervals: [0, 3, 7, 11], essential: [3, 11], nameEs: 'Menor-mayor séptima', nameEn: 'Minor-major seventh', family: 'seventh' },
  { id: '7sus4', suffix: '7sus4', aliases: ['7sus'], intervals: [0, 5, 7, 10], essential: [5, 10], nameEs: 'Séptima suspendido', nameEn: 'Seventh suspended', family: 'seventh' },
  { id: '7b5', suffix: '7b5', aliases: ['7♭5'], intervals: [0, 4, 6, 10], essential: [4, 6, 10], nameEs: 'Séptima quinta bemol', nameEn: 'Seventh flat five', family: 'seventh' },
  { id: '7#5', suffix: '7#5', aliases: ['7aug', 'aug7'], intervals: [0, 4, 8, 10], essential: [4, 8, 10], nameEs: 'Séptima quinta aumentada', nameEn: 'Seventh sharp five', family: 'seventh' },
  { id: 'add9', suffix: 'add9', aliases: ['add2'], intervals: [0, 4, 7, 14], essential: [4, 2], nameEs: 'Añadido novena', nameEn: 'Added ninth', family: 'extended' },
  { id: 'madd9', suffix: 'madd9', aliases: ['m(add9)'], intervals: [0, 3, 7, 14], essential: [3, 2], nameEs: 'Menor añadido novena', nameEn: 'Minor added ninth', family: 'extended' },
  { id: '9', suffix: '9', aliases: ['dom9'], intervals: [0, 4, 7, 10, 14], essential: [4, 10, 2], nameEs: 'Novena', nameEn: 'Ninth', family: 'extended' },
  { id: 'maj9', suffix: 'maj9', aliases: ['M9', 'Δ9'], intervals: [0, 4, 7, 11, 14], essential: [4, 11, 2], nameEs: 'Mayor novena', nameEn: 'Major ninth', family: 'extended' },
  { id: 'm9', suffix: 'm9', aliases: ['min9', '-9'], intervals: [0, 3, 7, 10, 14], essential: [3, 10, 2], nameEs: 'Menor novena', nameEn: 'Minor ninth', family: 'extended' },
  { id: '69', suffix: '6/9', aliases: ['69', '6add9'], intervals: [0, 4, 7, 9, 14], essential: [4, 9, 2], nameEs: 'Sexta novena', nameEn: 'Six-nine', family: 'extended' },
  { id: '11', suffix: '11', aliases: [], intervals: [0, 4, 7, 10, 14, 17], essential: [4, 10, 5], nameEs: 'Once', nameEn: 'Eleventh', family: 'extended' },
  { id: 'm11', suffix: 'm11', aliases: [], intervals: [0, 3, 7, 10, 14, 17], essential: [3, 10, 5], nameEs: 'Menor once', nameEn: 'Minor eleventh', family: 'extended' },
  { id: '13', suffix: '13', aliases: [], intervals: [0, 4, 7, 10, 14, 17, 21], essential: [4, 10, 9], nameEs: 'Trece', nameEn: 'Thirteenth', family: 'extended' },
  { id: 'maj13', suffix: 'maj13', aliases: ['M13', 'Δ13'], intervals: [0, 4, 7, 11, 14, 17, 21], essential: [4, 11, 9], nameEs: 'Mayor trece', nameEn: 'Major thirteenth', family: 'extended' },
  { id: 'm13', suffix: 'm13', aliases: ['min13', '-13'], intervals: [0, 3, 7, 10, 14, 17, 21], essential: [3, 10, 9], nameEs: 'Menor trece', nameEn: 'Minor thirteenth', family: 'extended' },
]

export const QUALITY_BY_ID = Object.fromEntries(QUALITY_LIST.map((q) => [q.id, q])) as Record<QualityId, Quality>

const EXACT: Record<string, QualityId> = {}
const LOWER: Record<string, QualityId> = {}

for (const quality of QUALITY_LIST) {
  EXACT[quality.suffix] = quality.id
  for (const alias of quality.aliases) {
    EXACT[alias] = quality.id
    if (alias.length > 1) LOWER[alias.toLowerCase()] = quality.id
  }
}

export function qualityById(id: QualityId): Quality {
  return QUALITY_BY_ID[id]
}

export function qualityFromSuffix(raw: string): Quality | null {
  const suffix = raw.trim()
  if (suffix === '') return QUALITY_BY_ID.maj
  const id = EXACT[suffix] ?? LOWER[suffix.toLowerCase()]
  return id ? QUALITY_BY_ID[id] : null
}

export function chordTones(rootPc: number, quality: Quality): number[] {
  return quality.intervals.map((interval) => (((rootPc + interval) % 12) + 12) % 12)
}

export function essentialTones(rootPc: number, quality: Quality): number[] {
  return quality.essential.map((interval) => (((rootPc + interval) % 12) + 12) % 12)
}

const DEGREE_BY_INTERVAL: Record<number, number> = {
  0: 0,
  1: 1,
  2: 1,
  3: 2,
  4: 2,
  5: 3,
  6: 3,
  7: 4,
  8: 4,
  9: 5,
  10: 6,
  11: 6,
  13: 1,
  14: 1,
  15: 1,
  17: 3,
  18: 3,
  21: 5,
}

export interface ChordTone {
  interval: number
  pc: number
  anglo: string
  latin: string
}

export function chordToneSpelling(rootPc: number, quality: Quality, preferFlat: boolean): ChordTone[] {
  const tonicLetter = tonicLetterIndex(rootPc, preferFlat)
  return quality.intervals.map((interval) => {
    const degree = DEGREE_BY_INTERVAL[interval] ?? 0
    const letter = (tonicLetter + degree) % 7
    const pc = (((rootPc + interval) % 12) + 12) % 12
    const spelled = spellNote(letter, pc)
    return { interval, pc, anglo: spelled.anglo, latin: spelled.latin }
  })
}

export function isTriadLike(quality: Quality): boolean {
  return quality.intervals.length <= 4
}
