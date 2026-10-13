import { useCallback, useEffect, useRef, useState } from 'react'
import { detectPitch, median } from '../music/pitch'

export type TunerStatus = 'idle' | 'starting' | 'listening' | 'denied' | 'unsupported' | 'error'

const WINDOW = 2048
const READ_EVERY_MS = 50
const SMOOTHING = 5
/** Keep showing the last note a moment after the string stops ringing. */
const HOLD_MS = 1200

/**
 * The microphone side of the tuner: asks for the mic only when started, reads the pitch ~20 times a second,
 * smooths it with a running median and releases the mic as soon as it is stopped or the tuner closes.
 */
export function useTuner(): { status: TunerStatus; frequency: number | null; start: () => Promise<void>; stop: () => void } {
  const [status, setStatus] = useState<TunerStatus>('idle')
  const [frequency, setFrequency] = useState<number | null>(null)
  const session = useRef<{ stream: MediaStream; context: AudioContext; timer: number } | null>(null)

  const stop = useCallback(() => {
    const current = session.current
    session.current = null
    if (!current) return
    window.clearInterval(current.timer)
    current.stream.getTracks().forEach((track) => track.stop())
    void current.context.close().catch(() => undefined)
    setStatus('idle')
    setFrequency(null)
  }, [])

  const start = useCallback(async () => {
    if (session.current) return
    if (!navigator.mediaDevices?.getUserMedia || typeof AudioContext === 'undefined') {
      setStatus('unsupported')
      return
    }
    setStatus('starting')
    let stream: MediaStream
    try {
      // Raw signal: the voice-call processing (echo cancelling, noise gate, auto gain) bends a string's pitch.
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
    } catch (error) {
      const name = (error as DOMException | null)?.name
      setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error')
      return
    }
    const context = new AudioContext()
    await context.resume().catch(() => undefined)
    const analyser = context.createAnalyser()
    analyser.fftSize = WINDOW
    context.createMediaStreamSource(stream).connect(analyser)
    const buffer = new Float32Array(WINDOW)
    const recent: number[] = []
    let lastHeard = 0
    const timer = window.setInterval(() => {
      analyser.getFloatTimeDomainData(buffer)
      const reading = detectPitch(buffer, context.sampleRate)
      const now = performance.now()
      if (reading) {
        // A jump of more than a semitone starts a fresh note instead of averaging across two.
        const previous = recent[recent.length - 1]
        if (previous && Math.abs(Math.log2(reading.frequency / previous)) > 1 / 12) recent.length = 0
        recent.push(reading.frequency)
        if (recent.length > SMOOTHING) recent.shift()
        lastHeard = now
        setFrequency(median(recent))
      } else if (now - lastHeard > HOLD_MS) {
        recent.length = 0
        setFrequency(null)
      }
    }, READ_EVERY_MS)
    session.current = { stream, context, timer }
    setStatus('listening')
  }, [])

  useEffect(() => stop, [stop])

  return { status, frequency, start, stop }
}
