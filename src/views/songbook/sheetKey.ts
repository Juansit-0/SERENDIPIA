import { suggestionFunction, type SuggestionFn } from '../../components/chord/suggestFn'
import { detectProgressionKey, type DetectedKey } from '../../music/analysis'
import type { ParsedChord } from '../../music/parseChord'
import type { Mode } from '../../music/scales'

/** The key a song is in, read from its chords (two or more), or null. */
export function sheetKey(chords: ParsedChord[]): DetectedKey | null {
  if (chords.length < 2) return null
  return detectProgressionKey(
    chords.map((chord) => ({ rootPc: chord.rootPc, qualityId: chord.quality.id, anglo: chord.anglo, latin: chord.latin })),
  )
}

/** The harmonic function a chord plays in the song's key: it colours the chord like a star of the strip. */
export function chordFunction(chord: ParsedChord, key: { rootPc: number; mode: Mode } | null): SuggestionFn | undefined {
  return key ? suggestionFunction({ rootPc: chord.rootPc, qualityId: chord.quality.id }, key.rootPc, key.mode) : undefined
}

/** The song's chords, each once, in the order they first appear. */
export function uniqueChords(chords: ParsedChord[], limit = 8): ParsedChord[] {
  const seen = new Map<string, ParsedChord>()
  for (const chord of chords) {
    if (!seen.has(chord.anglo)) seen.set(chord.anglo, chord)
    if (seen.size === limit) break
  }
  return [...seen.values()]
}
