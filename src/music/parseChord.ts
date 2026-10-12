import { Quality, QualityId, qualityById, qualityFromSuffix } from './chords'
import { Accidental, chordAccidental, latinName, parsePitchToken, pitchName, typedAccidental } from './notes'

export interface ParsedChord {
  rootPc: number
  quality: Quality
  bassPc: number | null
  accidental: Accidental
  anglo: string
  latin: string
  bassAnglo: string | null
  bassLatin: string | null
}

export function normalizeInput(input: string): string {
  return input
    .trim()
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b')
    .replace(/Δ/g, 'maj')
    .replace(/6\/9/g, '69')
}

export function isMinorQuality(quality: Quality): boolean {
  return quality.intervals.includes(3) && !quality.intervals.includes(4)
}

function parseRoot(head: string): { rootPc: number; suffix: string; token: string } | null {
  for (let len = head.length; len >= 1; len -= 1) {
    const candidate = head.slice(0, len)
    const pc = parsePitchToken(candidate)
    if (pc === null) continue
    const suffix = head.slice(len)
    if (qualityFromSuffix(suffix) === null) continue
    return { rootPc: pc, suffix, token: candidate }
  }
  return null
}

export function parseChord(input: string): ParsedChord | null {
  const raw = normalizeInput(input)
  if (!raw) return null
  const parts = raw.split('/')
  if (parts.length > 2) return null
  const [head, bassToken] = parts
  const root = parseRoot(head)
  if (!root) return null
  const quality = qualityFromSuffix(root.suffix)
  if (!quality) return null

  let bassPc: number | null = null
  if (bassToken !== undefined) {
    bassPc = parsePitchToken(bassToken)
    if (bassPc === null) return null
  }

  const accidental = typedAccidental(root.token) ?? chordAccidental(root.rootPc, isMinorQuality(quality))
  const bassAccidental =
    bassPc !== null ? (typedAccidental(bassToken) ?? chordAccidental(bassPc)) : accidental
  const angloBase = `${pitchName(root.rootPc, accidental)}${quality.suffix}`
  const latinBase = `${latinName(root.rootPc, accidental)}${latinSuffix(quality.suffix)}`

  return {
    rootPc: root.rootPc,
    quality,
    bassPc,
    accidental,
    anglo: bassPc !== null ? `${angloBase}/${pitchName(bassPc, bassAccidental)}` : angloBase,
    latin: bassPc !== null ? `${latinBase}/${latinName(bassPc, bassAccidental)}` : latinBase,
    bassAnglo: bassPc !== null ? pitchName(bassPc, bassAccidental) : null,
    bassLatin: bassPc !== null ? latinName(bassPc, bassAccidental) : null,
  }
}

export function latinSuffix(suffix: string): string {
  return suffix === '' ? '' : ` ${suffix}`
}

export function formatChord(
  rootPc: number,
  qualityId: QualityId,
  options: { accidental?: Accidental; bassPc?: number | null } = {},
): { anglo: string; latin: string } {
  const quality = qualityById(qualityId)
  const accidental = options.accidental ?? chordAccidental(rootPc, isMinorQuality(quality))
  const baseAnglo = `${pitchName(rootPc, accidental)}${quality.suffix}`
  const baseLatin = `${latinName(rootPc, accidental)}${latinSuffix(quality.suffix)}`
  if (options.bassPc === undefined || options.bassPc === null) {
    return { anglo: baseAnglo, latin: baseLatin }
  }
  const bassAccidental = chordAccidental(options.bassPc)
  return {
    anglo: `${baseAnglo}/${pitchName(options.bassPc, bassAccidental)}`,
    latin: `${baseLatin}/${latinName(options.bassPc, bassAccidental)}`,
  }
}

export function chordLabel(parsed: ParsedChord, notation: 'anglo' | 'latin' | 'both'): string {
  if (notation === 'latin') return parsed.latin
  if (notation === 'both') return parsed.anglo === parsed.latin ? parsed.anglo : `${parsed.anglo} · ${parsed.latin}`
  return parsed.anglo
}
