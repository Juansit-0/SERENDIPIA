import { detectFromMidi, type DetectionCandidate } from './detectChord'
import { freqToMidi } from './notes'

/*
 * Hearing a strummed chord: spectral peaks → notes (overtones that would add false notes are dropped)
 * → the same chord naming the fretboard uses.
 */

export interface HeardNote {
  midi: number
  frequency: number
  level: number
}

export interface Hearing {
  notes: HeardNote[]
  /** The best names for what was heard, most likely first. */
  candidates: DetectionCandidate[]
  /** 0–1: how much of the sound the best chord explains. */
  confidence: number
}

const LOW_HZ = 70
const HIGH_HZ = 1400
/** A peak must stand this far above the spectrum's typical level to count as a note. */
const FLOOR_RATIO = 8
const MIN_RELATIVE = 0.06
const MAX_CENTS_OFF = 35

interface Peak {
  frequency: number
  level: number
}

function findPeaks(magnitudes: Float32Array, sampleRate: number, fftSize: number): Peak[] {
  const hz = sampleRate / fftSize
  const from = Math.max(2, Math.floor(LOW_HZ / hz))
  const to = Math.min(magnitudes.length - 3, Math.ceil(HIGH_HZ / hz))
  const band = Array.from(magnitudes.subarray(from, to)).sort((a, b) => a - b)
  const floor = band[Math.floor(band.length / 2)] * FLOOR_RATIO
  let loudest = 0
  for (let i = from; i < to; i += 1) loudest = Math.max(loudest, magnitudes[i])
  const threshold = Math.max(floor, loudest * MIN_RELATIVE)
  const peaks: Peak[] = []
  for (let i = from; i < to; i += 1) {
    const value = magnitudes[i]
    if (value < threshold) continue
    if (value < magnitudes[i - 1] || value < magnitudes[i + 1] || value < magnitudes[i - 2] || value < magnitudes[i + 2]) continue
    // Parabolic interpolation on the log magnitude for a sharper frequency.
    const a = Math.log(magnitudes[i - 1] + 1e-12)
    const b = Math.log(value + 1e-12)
    const c = Math.log(magnitudes[i + 1] + 1e-12)
    const shift = (0.5 * (a - c)) / (a - 2 * b + c || 1)
    peaks.push({ frequency: (i + shift) * hz, level: value })
  }
  return peaks
}

/** True when `peak` sits on an overtone (×3, ×5, ×6, ×7) of a lower, comparably loud peak: it adds no real note. */
function isOvertone(peak: Peak, lower: Peak[]): boolean {
  return lower.some((base) =>
    [3, 5, 6, 7].some((harmonic) => {
      const ratio = peak.frequency / (base.frequency * harmonic)
      return Math.abs(ratio - 1) < 0.018 && peak.level < base.level * 1.6
    }),
  )
}

export function hearChord(magnitudes: Float32Array, sampleRate: number, fftSize: number): Hearing | null {
  const peaks = findPeaks(magnitudes, sampleRate, fftSize).sort((a, b) => a.frequency - b.frequency)
  const kept: Peak[] = []
  for (const peak of peaks) if (!isOvertone(peak, kept)) kept.push(peak)

  const notes: HeardNote[] = []
  for (const peak of kept) {
    const exact = freqToMidi(peak.frequency)
    const midi = Math.round(exact)
    if (Math.abs(exact - midi) * 100 > MAX_CENTS_OFF) continue
    const same = notes.find((note) => note.midi === midi)
    if (same) same.level += peak.level
    else notes.push({ midi, frequency: peak.frequency, level: peak.level })
  }
  if (notes.length < 2) return null

  // Pitch-class weight: the octaves of a note add up.
  const weight = new Array<number>(12).fill(0)
  for (const note of notes) weight[note.midi % 12] += Math.sqrt(note.level)
  const heaviest = Math.max(...weight)
  const active = new Set(weight.map((value, pc) => (value >= heaviest * 0.22 ? pc : -1)).filter((pc) => pc >= 0))
  // Bass: the lowest note that is loud enough to be meant.
  const loudestNote = Math.max(...notes.map((note) => note.level))
  const bass = notes.find((note) => active.has(note.midi % 12) && note.level >= loudestNote * 0.12)
  const midi = [...new Set(notes.filter((note) => active.has(note.midi % 12)).map((note) => note.midi))]
  if (bass && !midi.includes(bass.midi)) midi.push(bass.midi)
  const result = detectFromMidi(midi)
  const best = result.candidates[0]
  if (!best) return null
  const total = weight.reduce((sum, value) => sum + value, 0)
  const explained = best.matched.reduce((sum, pc) => sum + weight[pc], 0)
  return { notes, candidates: result.candidates, confidence: total > 0 ? explained / total : 0 }
}
