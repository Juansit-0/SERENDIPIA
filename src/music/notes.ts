export type Accidental = 'sharp' | 'flat'

export const PITCH_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export const PITCH_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
export const LATIN_SHARP = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si']
export const LATIN_FLAT = ['Do', 'Reb', 'Re', 'Mib', 'Mi', 'Fa', 'Solb', 'Sol', 'Lab', 'La', 'Sib', 'Si']

const LETTERS: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }
const LATIN_ROOTS: Array<[string, number]> = [
  ['do', 0],
  ['re', 2],
  ['mi', 4],
  ['fa', 5],
  ['sol', 7],
  ['la', 9],
  ['si', 11],
]

const FLAT_ROOTS = new Set([1, 3, 6, 8, 10])
const FLAT_MAJOR_KEYS = new Set([5, 10, 3, 8, 1, 6])
const FLAT_MINOR_KEYS = new Set([2, 7, 0, 5, 10, 3])

function mod12(value: number): number {
  return ((value % 12) + 12) % 12
}

export function parsePitchToken(token: string): number | null {
  const raw = token.trim()
  if (!raw) return null
  const lower = raw.toLowerCase()
  let base: number | null = null
  let rest = ''
  for (const [name, pc] of LATIN_ROOTS) {
    if (lower.startsWith(name)) {
      base = pc
      rest = raw.slice(name.length)
      break
    }
  }
  if (base === null) {
    const letter = lower[0]
    if (!(letter in LETTERS)) return null
    base = LETTERS[letter]
    rest = raw.slice(1)
  }
  let offset = 0
  for (const ch of rest) {
    if (ch === '#' || ch === '♯') offset += 1
    else if (ch === 'b' || ch === '♭') offset -= 1
    else if (ch === '♮') continue
    else return null
  }
  return mod12(base + offset)
}

export function pcFromName(token: string): number | null {
  return parsePitchToken(token)
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

export function freqToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440)
}

export function pitchName(pc: number, accidental: Accidental = 'sharp'): string {
  return (accidental === 'flat' ? PITCH_FLAT : PITCH_SHARP)[mod12(pc)]
}

export function latinName(pc: number, accidental: Accidental = 'sharp'): string {
  return (accidental === 'flat' ? LATIN_FLAT : LATIN_SHARP)[mod12(pc)]
}

export function bothNames(pc: number, accidental: Accidental = 'sharp'): { anglo: string; latin: string } {
  return { anglo: pitchName(pc, accidental), latin: latinName(pc, accidental) }
}

export function chordAccidental(rootPc: number): Accidental {
  return FLAT_ROOTS.has(mod12(rootPc)) ? 'flat' : 'sharp'
}

export function keyAccidental(rootPc: number, mode: 'major' | 'minor'): Accidental {
  const set = mode === 'major' ? FLAT_MAJOR_KEYS : FLAT_MINOR_KEYS
  return set.has(mod12(rootPc)) ? 'flat' : 'sharp'
}

const LETTER_ORDER = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const LETTER_PCS = [0, 2, 4, 5, 7, 9, 11]
const LATIN_LETTERS = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si']

export interface SpelledNote {
  pc: number
  anglo: string
  latin: string
}

function tonicLetterIndex(rootPc: number, preferFlat: boolean): number {
  for (let index = 0; index < LETTER_PCS.length; index += 1) {
    const natural = LETTER_PCS[index]
    const diff = preferFlat ? mod12(natural - rootPc) : mod12(rootPc - natural)
    if (diff <= 1) return index
  }
  return 0
}

export function spellNote(letterIndex: number, pc: number): SpelledNote {
  const natural = LETTER_PCS[letterIndex]
  let diff = mod12(pc - natural)
  if (diff > 6) diff -= 12
  const accidental = diff > 0 ? '#'.repeat(diff) : 'b'.repeat(-diff)
  return {
    pc,
    anglo: `${LETTER_ORDER[letterIndex]}${accidental}`,
    latin: `${LATIN_LETTERS[letterIndex]}${accidental}`,
  }
}

export function spelledScale(rootPc: number, steps: number[], preferFlat = chordAccidental(rootPc) === 'flat'): SpelledNote[] {
  const tonicLetter = tonicLetterIndex(rootPc, preferFlat)
  return steps.map((step, degree) => spellNote((tonicLetter + degree) % 7, mod12(rootPc + step)))
}

export function intervalName(semitone: number): string {
  const table: Record<number, string> = {
    0: '1',
    1: '♭2',
    2: '2',
    3: '♭3',
    4: '3',
    5: '4',
    6: '♭5',
    7: '5',
    8: '♯5',
    9: '6',
    10: '♭7',
    11: '7',
    13: '♭9',
    14: '9',
    15: '♯9',
    17: '11',
    18: '♯11',
    21: '13',
  }
  return table[semitone] ?? `${semitone}`
}
