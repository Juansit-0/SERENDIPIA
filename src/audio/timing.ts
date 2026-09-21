export function beatsToNotation(beats: number): string {
  if (beats <= 1) return '4n'
  if (beats === 2) return '2n'
  if (beats >= 8) return '2m'
  return '1m'
}

export function stepDurationSeconds(tempo: number, beatsPerChord: number): number {
  return (60 / tempo) * beatsPerChord
}
