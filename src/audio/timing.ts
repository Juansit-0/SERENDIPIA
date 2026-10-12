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
