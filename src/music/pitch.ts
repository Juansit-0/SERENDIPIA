/*
 * Pitch detection for the tuner: the McLeod pitch method (normalised square difference).
 * It finds the period of a guitar string reliably even when the second harmonic is louder than the fundamental.
 */

export interface PitchReading {
  frequency: number
  /** 0–1: how periodic the sound is. Below ~0.85 it is noise or a chord, not one string. */
  clarity: number
}

export const MIN_FREQUENCY = 60
export const MAX_FREQUENCY = 1100
const SILENCE_RMS = 0.008
const PEAK_THRESHOLD = 0.9
const MIN_CLARITY = 0.85

export function detectPitch(buffer: Float32Array, sampleRate: number): PitchReading | null {
  const size = buffer.length
  let energy = 0
  for (let i = 0; i < size; i += 1) energy += buffer[i] * buffer[i]
  if (Math.sqrt(energy / size) < SILENCE_RMS) return null

  const minLag = Math.max(2, Math.floor(sampleRate / MAX_FREQUENCY))
  const maxLag = Math.min(size - 2, Math.ceil(sampleRate / MIN_FREQUENCY))
  const nsdf = new Float32Array(maxLag + 2)
  for (let lag = minLag; lag <= maxLag + 1; lag += 1) {
    let acf = 0
    let norm = 0
    for (let i = 0; i < size - lag; i += 1) {
      const a = buffer[i]
      const b = buffer[i + lag]
      acf += a * b
      norm += a * a + b * b
    }
    nsdf[lag] = norm > 0 ? (2 * acf) / norm : 0
  }

  // Key maxima: the highest point of each stretch where the curve is positive, after it first dips below zero.
  const peaks: number[] = []
  let lag = minLag
  while (lag <= maxLag && nsdf[lag] > 0) lag += 1
  while (lag <= maxLag) {
    while (lag <= maxLag && nsdf[lag] <= 0) lag += 1
    let best = -1
    while (lag <= maxLag && nsdf[lag] > 0) {
      if (best < 0 || nsdf[lag] > nsdf[best]) best = lag
      lag += 1
    }
    if (best > 0) peaks.push(best)
  }
  if (peaks.length === 0) return null

  const highest = Math.max(...peaks.map((peak) => nsdf[peak]))
  const chosen = peaks.find((peak) => nsdf[peak] >= highest * PEAK_THRESHOLD) ?? peaks[0]

  // Parabolic interpolation around the chosen lag for sub-sample precision.
  const left = nsdf[chosen - 1]
  const mid = nsdf[chosen]
  const right = nsdf[chosen + 1]
  const denominator = left - 2 * mid + right
  const shift = denominator === 0 ? 0 : (0.5 * (left - right)) / denominator
  const period = chosen + Math.max(-0.5, Math.min(0.5, shift))
  const clarity = mid - 0.25 * (left - right) * shift
  if (clarity < MIN_CLARITY) return null
  const frequency = sampleRate / period
  if (frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY) return null
  return { frequency, clarity: Math.min(1, clarity) }
}

/** Median of the recent readings: steadies the needle without lagging behind a real change. */
export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
