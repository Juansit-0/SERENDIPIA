import { describe, expect, it } from 'vitest'
import { magnitudeSpectrum } from './fft'
import { hearChord } from './listen'
import { midiToFreq } from './notes'

const RATE = 48000
const SIZE = 16384
const STANDARD = [40, 45, 50, 55, 59, 64]

/** A strummed chord: each string a decaying tone with the uneven harmonics of a real string, plus a little noise. */
function strum(frets: (number | null)[], tuning = STANDARD, detuneCents = 0, noise = 0.01) {
  const buffer = new Float32Array(SIZE)
  let seed = 11
  frets.forEach((fret, string) => {
    if (fret === null) return
    // Each string off by a different amount, as on a guitar that has drifted a little.
    const f = midiToFreq(tuning[string] + fret) * 2 ** ((detuneCents * ((string % 3) - 1)) / 1200)
    const partials = [1, 0.8, 0.45, 0.3, 0.22, 0.12, 0.08]
    const phase = string * 1.3
    for (let i = 0; i < SIZE; i += 1) {
      const t = i / RATE
      let value = 0
      partials.forEach((amp, h) => {
        value += amp * Math.exp(-t * (1.5 + h)) * Math.sin(2 * Math.PI * f * (h + 1) * t + phase * (h + 1))
      })
      buffer[i] += value * 0.12
    }
  })
  for (let i = 0; i < SIZE; i += 1) {
    seed = (seed * 16807) % 2147483647
    buffer[i] += (seed / 2147483647 - 0.5) * noise
  }
  return buffer
}

const hear = (frets: (number | null)[]) => hearChord(magnitudeSpectrum(strum(frets)), RATE, SIZE)

describe('hearChord', () => {
  it.each([
    ['C', [null, 3, 2, 0, 1, 0]],
    ['Am', [null, 0, 2, 2, 1, 0]],
    ['G', [3, 2, 0, 0, 0, 3]],
    ['E', [0, 2, 2, 1, 0, 0]],
    ['Em', [0, 2, 2, 0, 0, 0]],
    ['D', [null, null, 0, 2, 3, 2]],
    ['Dm', [null, null, 0, 2, 3, 1]],
    ['F', [1, 3, 3, 2, 1, 1]],
    ['E7', [0, 2, 0, 1, 0, 0]],
    ['Am7', [null, 0, 2, 0, 1, 0]],
    ['Cmaj7', [null, 3, 2, 0, 0, 0]],
    ['Bm', [null, 2, 4, 4, 3, 2]],
  ] as Array<[string, (number | null)[]]>)('hears %s', (name, frets) => {
    const heard = hear(frets)
    expect(heard?.candidates[0].anglo).toBe(name)
  })

  it('hears an inversion as a slash chord', () => {
    expect(hear([null, null, 0, 2, 3, 2].map((f, i) => (i === 0 ? 2 : f)))?.candidates[0].anglo).toBe('D/F#')
  })

  it('copes with a guitar a little out of tune and a noisy room', () => {
    const heard = hearChord(magnitudeSpectrum(strum([null, 3, 2, 0, 1, 0], STANDARD, 18, 0.06)), RATE, SIZE)
    expect(heard?.candidates[0].anglo).toBe('C')
    expect(heard!.confidence).toBeGreaterThan(0.7)
  })

  it('stays silent on silence and a single note', () => {
    expect(hearChord(magnitudeSpectrum(new Float32Array(SIZE)), RATE, SIZE)).toBeNull()
    expect(hear([null, 0, null, null, null, null])).toBeNull()
  })
})
