import { useCallback, useEffect, useRef, useState } from 'react'
import type { DetectionCandidate } from '../music/detectChord'
import { hearChord } from '../music/listen'
import { openMic, type MicFailure } from './mic'

export type ListenerStatus = 'idle' | 'starting' | 'listening' | MicFailure

/** ~0.34 s at 48 kHz: long enough to tell a low E from an F. */
const FFT_SIZE = 16384
const READ_EVERY_MS = 120
/** A chord counts once it has been heard this many times in a row with enough confidence. */
const STABLE_READS = 3
const MIN_CONFIDENCE = 0.62
const HOLD_MS = 1500

export interface Heard {
  candidate: DetectionCandidate
  alternatives: DetectionCandidate[]
  confidence: number
}

/**
 * Listens to the guitar and names the chord being strummed. `heard` is the latest steady reading (held a moment
 * after the strings die away); `onChord` fires once each time a new chord settles.
 */
export function useChordListener(onChord: (candidate: DetectionCandidate) => void): {
  status: ListenerStatus
  heard: Heard | null
  start: () => Promise<void>
  stop: () => void
} {
  const [status, setStatus] = useState<ListenerStatus>('idle')
  const [heard, setHeard] = useState<Heard | null>(null)
  const session = useRef<{ close: () => void; timer: number } | null>(null)
  const callback = useRef(onChord)
  useEffect(() => {
    callback.current = onChord
  }, [onChord])

  const stop = useCallback(() => {
    const current = session.current
    session.current = null
    if (!current) return
    window.clearInterval(current.timer)
    current.close()
    setStatus('idle')
    setHeard(null)
  }, [])

  const start = useCallback(async () => {
    if (session.current) return
    setStatus('starting')
    const mic = await openMic(FFT_SIZE)
    if (typeof mic === 'string') {
      setStatus(mic)
      return
    }
    const { analyser, context } = mic
    const decibels = new Float32Array(analyser.frequencyBinCount)
    const magnitudes = new Float32Array(analyser.frequencyBinCount)
    let streak = { name: '', count: 0 }
    let settled = ''
    let lastHeard = 0
    const timer = window.setInterval(() => {
      analyser.getFloatFrequencyData(decibels)
      for (let i = 0; i < decibels.length; i += 1) magnitudes[i] = decibels[i] === -Infinity ? 0 : 10 ** (decibels[i] / 20)
      const hearing = hearChord(magnitudes, context.sampleRate, FFT_SIZE)
      const now = performance.now()
      const best = hearing?.candidates[0]
      if (!hearing || !best || hearing.confidence < MIN_CONFIDENCE) {
        streak = { name: '', count: 0 }
        if (now - lastHeard > HOLD_MS) {
          settled = ''
          setHeard(null)
        }
        return
      }
      streak = best.anglo === streak.name ? { name: best.anglo, count: streak.count + 1 } : { name: best.anglo, count: 1 }
      if (streak.count < STABLE_READS) return
      lastHeard = now
      setHeard({ candidate: best, alternatives: hearing.candidates.slice(1, 4), confidence: hearing.confidence })
      if (best.anglo !== settled) {
        settled = best.anglo
        callback.current(best)
      }
    }, READ_EVERY_MS)
    session.current = { close: mic.close, timer }
    setStatus('listening')
  }, [])

  useEffect(() => stop, [stop])

  return { status, heard, start, stop }
}
