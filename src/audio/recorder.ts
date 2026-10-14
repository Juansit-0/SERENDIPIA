/** Formats browsers record to, best first (Safari only does MP4/AAC). */
const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']

export type RecorderFailure = 'denied' | 'unsupported' | 'error'

export interface Recording {
  mime: string
  /** Stops and hands back the take. */
  stop: () => Promise<Blob>
  /** Stops and throws the take away. */
  cancel: () => void
}

export function recordingSupported(): boolean {
  return typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
}

/**
 * Records the microphone. Voice processing is off: echo cancelling and noise suppression would eat the guitar.
 * (So with speakers the backing is heard in the take too; headphones keep it clean.)
 */
export async function startRecording(): Promise<Recording | RecorderFailure> {
  if (!recordingSupported()) return 'unsupported'
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
  } catch (error) {
    const name = (error as DOMException | null)?.name
    return name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error'
  }
  const mime = MIME_TYPES.find((type) => MediaRecorder.isTypeSupported?.(type)) ?? ''
  const recorder = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 128000 } : undefined)
  const chunks: Blob[] = []
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  }
  recorder.start(250)
  const release = () => stream.getTracks().forEach((track) => track.stop())
  return {
    mime: recorder.mimeType || mime || 'audio/webm',
    stop: () =>
      new Promise((resolve) => {
        recorder.onstop = () => {
          release()
          resolve(new Blob(chunks, { type: recorder.mimeType || mime || 'audio/webm' }))
        }
        recorder.stop()
      }),
    cancel: () => {
      recorder.onstop = release
      if (recorder.state !== 'inactive') recorder.stop()
      else release()
    },
  }
}
