import { freqToMidi, midiToFreq } from './notes'

export interface TunerReading {
  /** Nearest chromatic note (MIDI number). */
  midi: number
  /** Cents from that nearest note, −50 … +50. */
  cents: number
  /** The open string being tuned: the chosen one, or the nearest to the sound. */
  stringIndex: number
  /** Cents from that string's target pitch (can be far beyond ±50). */
  stringCents: number
}

/** Within this many cents a string counts as in tune. */
export const IN_TUNE_CENTS = 5

export function centsBetween(frequency: number, targetMidi: number): number {
  return 1200 * Math.log2(frequency / midiToFreq(targetMidi))
}

export function nearestString(frequency: number, tuning: number[]): number {
  const played = freqToMidi(frequency)
  let best = 0
  tuning.forEach((midi, index) => {
    if (Math.abs(midi - played) < Math.abs(tuning[best] - played)) best = index
  })
  return best
}

export function readTuner(frequency: number, tuning: number[], chosenString: number | null = null): TunerReading {
  const exact = freqToMidi(frequency)
  const midi = Math.round(exact)
  const stringIndex = chosenString ?? nearestString(frequency, tuning)
  return {
    midi,
    cents: Math.round((exact - midi) * 100),
    stringIndex,
    stringCents: Math.round(centsBetween(frequency, tuning[stringIndex])),
  }
}

export type TuneAdvice = 'in-tune' | 'tighten' | 'loosen'

/** Flat → tighten the string (raise the pitch); sharp → loosen it. */
export function tuneAdvice(stringCents: number): TuneAdvice {
  if (Math.abs(stringCents) <= IN_TUNE_CENTS) return 'in-tune'
  return stringCents < 0 ? 'tighten' : 'loosen'
}
