import type { ParsedSheet } from '../../music/chordpro'

export interface SongPart {
  name: string
  /** Chord indexes, `from` included, `to` excluded, in the order they are sung. */
  from: number
  to: number
}

/**
 * The song's parts, to loop one of them: a section heading ({comment: Verso}) starts a part, and so does a chorus
 * ({start_of_chorus}) that has no heading of its own. Chords before the first heading form «Inicio». Parts without
 * chords are left out; repeated names get a number (Coro, Coro 2).
 */
export function songParts(sheet: ParsedSheet, labels: { chorus: string; intro: string }): SongPart[] {
  const parts: Array<{ name: string; from: number }> = []
  let index = 0
  let inChorus = false
  let pendingName: string | null = null
  for (const line of sheet.lines) {
    if (line.kind === 'comment') {
      pendingName = line.text.trim() || pendingName
      parts.push({ name: pendingName ?? labels.intro, from: index })
      continue
    }
    if (line.kind !== 'lyrics') continue
    if (line.chorus && !inChorus) {
      const last = parts[parts.length - 1]
      // A chorus right under its own heading belongs to that heading.
      if (!(last && last.from === index && pendingName)) parts.push({ name: labels.chorus, from: index })
    }
    inChorus = line.chorus
    pendingName = null
    for (const segment of line.segments) if (segment.index >= 0) index = segment.index + 1
  }
  if (parts.length === 0 || parts[0].from > 0) parts.unshift({ name: labels.intro, from: 0 })

  const seen = new Map<string, number>()
  const result: SongPart[] = []
  parts.forEach((part, i) => {
    const to = i + 1 < parts.length ? parts[i + 1].from : sheet.chords.length
    if (to <= part.from) return
    const count = (seen.get(part.name) ?? 0) + 1
    seen.set(part.name, count)
    result.push({ name: count > 1 ? `${part.name} ${count}` : part.name, from: part.from, to })
  })
  return result
}
