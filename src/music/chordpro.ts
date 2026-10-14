import { transposeChord } from './capo'
import { parseChord, type ParsedChord } from './parseChord'

/*
 * ChordPro, the songbook format: lyrics with chords in brackets where they fall — "[C]Hoy el [G]cielo".
 * Directives in braces: {title: …}, {comment: …} / {c: …}, {start_of_chorus}/{soc}, {end_of_chorus}/{eoc}.
 */

export interface Segment {
  /** The chord as written (null for lyrics before the first chord of a line). */
  chord: string | null
  /** Parsed when it is a chord the app knows. */
  parsed: ParsedChord | null
  text: string
  /** Order of this chord in the whole song (for playback), -1 when there is no playable chord. */
  index: number
}

export type SheetLine =
  | { kind: 'lyrics'; segments: Segment[]; chorus: boolean }
  | { kind: 'comment'; text: string }
  | { kind: 'blank' }

export interface ParsedSheet {
  title: string | null
  lines: SheetLine[]
  /** Every playable chord, in the order it is sung. */
  chords: ParsedChord[]
}

const DIRECTIVE = /^\{\s*([a-z_]+)\s*(?::\s*(.*?))?\s*\}$/i

export function parseSheet(text: string, semitones = 0): ParsedSheet {
  let title: string | null = null
  let chorus = false
  const chords: ParsedChord[] = []
  const lines: SheetLine[] = []
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trimEnd()
    const directive = line.trim().match(DIRECTIVE)
    if (directive) {
      const [, name, value = ''] = directive
      const key = name.toLowerCase()
      if (key === 'title' || key === 't') title = value || title
      else if (key === 'comment' || key === 'c' || key === 'ci') lines.push({ kind: 'comment', text: value })
      else if (key === 'start_of_chorus' || key === 'soc') chorus = true
      else if (key === 'end_of_chorus' || key === 'eoc') chorus = false
      continue
    }
    if (!line.trim()) {
      lines.push({ kind: 'blank' })
      continue
    }
    const segments: Segment[] = []
    const pattern = /\[([^\]]*)\]/g
    let last = 0
    let match: RegExpExecArray | null
    let pending: string | null = null
    while ((match = pattern.exec(line))) {
      if (match.index > last || pending !== null) segments.push(segment(pending, line.slice(last, match.index)))
      pending = match[1].trim()
      last = pattern.lastIndex
    }
    segments.push(segment(pending, line.slice(last)))
    lines.push({ kind: 'lyrics', segments: segments.filter((item) => item.chord !== null || item.text !== ''), chorus })
  }
  return { title, lines, chords }

  function segment(chord: string | null, lyric: string): Segment {
    let parsed = chord ? parseChord(chord) : null
    if (parsed && semitones) parsed = transposeChord(parsed, semitones)
    const index = parsed ? chords.push(parsed) - 1 : -1
    return { chord: parsed ? parsed.anglo : chord, parsed, text: lyric, index }
  }
}

/** A short example shown in a new sheet: enough to see how the brackets work. */
export const SAMPLE_SHEET = `{title: Mi canción}
{comment: Verso}
[C]Escribe la letra y pon los a[G]cordes
[Am]entre corchetes, justo [F]antes de la sílaba

{start_of_chorus}
[F]Así se ven en[G]cima de la [C]letra
{end_of_chorus}`
