import { describe, expect, it } from 'vitest'
import { detectPitch, median } from './pitch'

const RATE = 48000

/** A plucked-string-like tone: fundamental plus louder 2nd and some 3rd harmonic, slightly noisy. */
function pluck(frequency: number, size = 2048, harmonics = [0.6, 1, 0.4]) {
  const buffer = new Float32Array(size)
  let seed = 7
  for (let i = 0; i < size; i += 1) {
    seed = (seed * 16807) % 2147483647
    const noise = (seed / 2147483647 - 0.5) * 0.02
    buffer[i] = harmonics.reduce((sum, amp, h) => sum + amp * Math.sin((2 * Math.PI * frequency * (h + 1) * i) / RATE), 0) * 0.3 + noise
  }
  return buffer
}

const cents = (a: number, b: number) => 1200 * Math.log2(a / b)

describe('detectPitch', () => {
  it.each([
    ['low E', 82.41],
    ['drop D', 73.42],
    ['A', 110],
    ['G', 196],
    ['high e', 329.63],
    ['12th fret e', 659.26],
  ])('finds the fundamental of %s within 2 cents', (_, frequency) => {
    const reading = detectPitch(pluck(frequency), RATE)!
    expect(reading).not.toBeNull()
    expect(Math.abs(cents(reading.frequency, frequency))).toBeLessThan(2)
  })

  it('is not fooled by a 2nd harmonic louder than the fundamental', () => {
    const reading = detectPitch(pluck(110, 2048, [0.3, 1, 0.5]), RATE)!
    expect(Math.abs(cents(reading.frequency, 110))).toBeLessThan(2)
  })

  it('stays quiet on silence and on noise', () => {
    expect(detectPitch(new Float32Array(2048), RATE)).toBeNull()
    const noise = new Float32Array(2048)
    let seed = 3
    for (let i = 0; i < noise.length; i += 1) {
      seed = (seed * 16807) % 2147483647
      noise[i] = (seed / 2147483647 - 0.5) * 0.5
    }
    expect(detectPitch(noise, RATE)).toBeNull()
  })
})

describe('median', () => {
  it('ignores a single wild reading', () => {
    expect(median([110, 110.2, 220, 109.9, 110.1])).toBeCloseTo(110.1)
    expect(median([1, 3])).toBe(2)
  })
})
