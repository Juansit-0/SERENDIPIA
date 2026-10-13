export type MicFailure = 'denied' | 'unsupported' | 'error'

export interface Mic {
  context: AudioContext
  analyser: AnalyserNode
  close: () => void
}

/**
 * Opens the microphone into an analyser. The raw signal is asked for: voice-call processing (echo cancelling,
 * noise gate, auto gain) bends a string's pitch and eats the quiet notes of a chord.
 */
export async function openMic(fftSize: number): Promise<Mic | MicFailure> {
  if (!navigator.mediaDevices?.getUserMedia || typeof AudioContext === 'undefined') return 'unsupported'
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    })
  } catch (error) {
    const name = (error as DOMException | null)?.name
    return name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error'
  }
  const context = new AudioContext()
  await context.resume().catch(() => undefined)
  const analyser = context.createAnalyser()
  analyser.fftSize = fftSize
  analyser.smoothingTimeConstant = 0
  context.createMediaStreamSource(stream).connect(analyser)
  return {
    context,
    analyser,
    close() {
      stream.getTracks().forEach((track) => track.stop())
      void context.close().catch(() => undefined)
    },
  }
}
