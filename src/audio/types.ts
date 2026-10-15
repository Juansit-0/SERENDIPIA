import type { BackingStyle } from './backing'
import type { StrumId } from './strums'
import type { Subdivision } from './timing'

export type PlayPattern = 'strum-down' | 'strum-up' | 'arpeggio' | 'block'
export type TimbreId = 'nylon' | 'steel' | 'electric' | 'jazz'

export const TIMBRES: Array<{ id: TimbreId; nameEs: string; nameEn: string }> = [
  { id: 'nylon', nameEs: 'Nylon', nameEn: 'Nylon' },
  { id: 'steel', nameEs: 'Acero', nameEn: 'Steel' },
  { id: 'electric', nameEs: 'Eléctrica', nameEn: 'Clean electric' },
  { id: 'jazz', nameEs: 'Jazz', nameEn: 'Jazz' },
]

export interface ProgressionOptions {
  stepCount: number
  tempo: number
  loop: boolean
  beatsPerChord: number
  tuning: number[]
  getFrets: (index: number) => (number | null)[] | null
  onStep: (index: number) => void
  onEnd?: () => void
  metronome?: boolean
  onBeat?: (beat: number) => void
  /** Strumming pattern for each step; a single strum when absent. */
  getStrum?: (index: number) => StrumId
  /** Metronome clicks per beat (1, 2 or 3), read at every beat. */
  getSubdivision?: () => Subdivision
  /** The backing band's style, read at every step so it can change while playing. */
  getBacking?: () => BackingStyle
  /** The pitch class the bass plays under each step (the chord's bass, else its root). */
  getBass?: (index: number) => number | null
  /** Beats of clicks before the first chord (4 = one bar of 4/4); none when absent. */
  countIn?: number
  /** During the count-in: the beats still to go (4, 3, 2, 1), then 0 as the first chord sounds. */
  onCount?: (remaining: number) => void
}
