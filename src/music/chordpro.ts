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

/* ---------- Editing without brackets ---------- */

export interface WordSlot {
  /** Where the word starts in the raw line (after any chord bracket in front of it). */
  start: number
  word: string
  /** The bracket just before the word, if any: its name and where it sits in the raw line. */
  chord: { name: string; from: number; to: number } | null
  /** True when this piece continues the word before it (a chord fell mid-word: «mi[Em]rar»). */
  attached: boolean
}

/**
 * The places a chord can go on one raw line: each word (with the chord already in front of it, if any), plus
 * a chord that ends the line with no lyric after it.
 */
export function lineSlots(raw: string): WordSlot[] {
  const slots: WordSlot[] = []
  const pattern = /(\[[^\]]*\])?(\S+)?/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(raw))) {
    if (match[0] === '') {
      pattern.lastIndex += 1
      continue
    }
    const bracket = match[1]
    let word = match[2] ?? ''
    // A word that holds a bracket inside («a[C]quí») is split there: each part is its own place.
    const inner = word.indexOf('[')
    if (inner > 0) {
      word = word.slice(0, inner)
      pattern.lastIndex = match.index + (bracket?.length ?? 0) + inner
    }
    const from = match.index
    slots.push({
      start: from + (bracket?.length ?? 0),
      word,
      chord: bracket ? { name: bracket.slice(1, -1).trim(), from, to: from + bracket.length } : null,
      attached: from > 0 && !/\s/.test(raw[from - 1]),
    })
  }
  return slots
}

/** Puts `chord` on a word (replacing the one there), or takes it off when `chord` is null. */
export function setChordAt(raw: string, slot: WordSlot, chord: string | null): string {
  const before = slot.chord ? raw.slice(0, slot.chord.from) : raw.slice(0, slot.start)
  const after = raw.slice(slot.start)
  return `${before}${chord ? `[${chord.trim()}]` : ''}${after}`
}

/** True for a line made only of chord names (and bar marks), the way songs are posted with chords on top. */
function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter((token) => !/^[|\\/\-–.:()x\d]+$/i.test(token))
  return tokens.length > 0 && tokens.every((token) => parseChord(token.replace(/[()]/g, '')) !== null)
}

/**
 * «Chords over lyrics» → ChordPro: each chord line is folded into the lyric line below it, the chord placed at its
 * column. A chord line with no lyrics under it becomes a line of chords alone. Text already in ChordPro is kept.
 */
export function chordsOverLyrics(text: string): { text: string; converted: boolean } {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const out: string[] = []
  let converted = false
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (!isChordLine(line) || line.includes('[')) {
      out.push(line)
      continue
    }
    converted = true
    const chords = [...line.matchAll(/\S+/g)]
      .filter((match) => parseChord(match[0].replace(/[()]/g, '')) !== null)
      .map((match) => ({ column: match.index ?? 0, name: match[0].replace(/[()]/g, '') }))
    const next = lines[index + 1]
    if (next === undefined || next.trim() === '' || isChordLine(next) || /^\s*\{/.test(next)) {
      out.push(chords.map((chord) => `[${chord.name}]`).join(' '))
      continue
    }
    let lyric = next.padEnd(Math.max(...chords.map((chord) => chord.column)), ' ')
    // A chord over a space belongs to the word that follows it.
    const at = (column: number) => {
      let position = column
      while (position < next.length && next[position] === ' ') position += 1
      return position < next.length ? position : column
    }
    for (const chord of [...chords].reverse()) {
      const position = at(chord.column)
      lyric = `${lyric.slice(0, position)}[${chord.name}]${lyric.slice(position)}`
    }
    out.push(lyric.trimEnd())
    index += 1
  }
  return { text: out.join('\n'), converted }
}
