import type { QualityId } from '../../music/chords'

export type NoteRole = 'root' | 'third' | 'seventh' | 'extension' | 'other'

/** Role of a chord tone from its interval (semitones above the root) and the chord quality. */
export function roleOfInterval(interval: number, qualityId: QualityId): NoteRole {
  if (interval === 0) return 'root'
  if (interval === 3 || interval === 4) return 'third'
  if (interval === 10 || interval === 11) return 'seventh'
  if (interval === 9 && qualityId === 'dim7') return 'seventh'
  if (interval >= 12) return 'extension'
  if (interval === 2 || interval === 5 || interval === 9 || interval === 1) return 'extension'
  return 'other'
}
