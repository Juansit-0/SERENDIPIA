import type { StrumId } from './strums'

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
}
