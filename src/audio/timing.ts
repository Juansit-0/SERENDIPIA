export const BEATS_PER_BAR = 4

export function isAccentBeat(beat: number): boolean {
  return ((Math.round(beat) % BEATS_PER_BAR) + BEATS_PER_BAR) % BEATS_PER_BAR === 0
}

export function beatsToNotation(beats: number): string {
  if (beats <= 1) return '4n'
  if (beats === 2) return '2n'
  if (beats === 4) return '1m'
  if (beats >= 8) return '2m'
  // Odd lengths as bars:beats:sixteenths, e.g. 3 beats = '0:3:0'.
  const whole = Math.round(beats)
  return `${Math.floor(whole / BEATS_PER_BAR)}:${whole % BEATS_PER_BAR}:0`
}

export function progressionTicks(stepCount: number, beatsPerChord: number, ppq: number): number {
  return Math.max(1, stepCount) * Math.max(1, beatsPerChord) * ppq
}

export function stepDurationSeconds(tempo: number, beatsPerChord: number): number {
  if (!(tempo > 0)) return 0
  return (60 / tempo) * beatsPerChord
}

/** Taps further apart than this start a new count. */
export const TAP_RESET_MS = 2000

/**
 * Tempo from taps (timestamps in ms, oldest first): the median gap of the last few, so one late tap does not
 * throw it off. Null until there are two taps in the current run.
 */
export function tapTempo(taps: number[], min = 40, max = 208): number | null {
  const run: number[] = []
  for (const tap of taps) {
    if (run.length && tap - run[run.length - 1] > TAP_RESET_MS) run.length = 0
    run.push(tap)
  }
  const recent = run.slice(-8)
  if (recent.length < 2) return null
  const gaps = recent.slice(1).map((tap, index) => tap - recent[index]).sort((a, b) => a - b)
  const middle = Math.floor(gaps.length / 2)
  const gap = gaps.length % 2 ? gaps[middle] : (gaps[middle - 1] + gaps[middle]) / 2
  return Math.min(max, Math.max(min, Math.round(60000 / gap)))
}

export type Subdivision = 1 | 2 | 3

/** Offsets within a beat (in beats) of the soft clicks a subdivision adds after the main one. */
export function subdivisionOffsets(subdivision: Subdivision): number[] {
  return Array.from({ length: subdivision - 1 }, (_, index) => (index + 1) / subdivision)
}
