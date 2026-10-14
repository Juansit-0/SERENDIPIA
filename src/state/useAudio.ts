import { useCallback, useEffect, useRef, useState } from 'react'
import { loadAudioEngine, loadedAudioEngine, prefetchAudioEngine } from '../audio/loader'
import type { TimbreId } from '../audio/types'

/**
 * The audio engine as the store sees it: loaded in the background, started on the first gesture that needs
 * sound, kept at the chosen volume and timbre.
 */
export function useAudio(volume: number, timbre: TimbreId) {
  const [audioReady, setAudioReady] = useState(false)
  const [audioLoading, setAudioLoading] = useState<TimbreId | null>(null)
  const [audioFallback, setAudioFallback] = useState(false)
  const volumeRef = useRef(volume)

  useEffect(() => {
    prefetchAudioEngine()
    return () => {
      const engine = loadedAudioEngine()
      if (engine) {
        engine.onLoadingChange = null
        engine.onFallback = null
      }
    }
  }, [])

  useEffect(() => {
    volumeRef.current = volume
    loadedAudioEngine()?.setVolume(volume)
  }, [volume])

  const enableAudio = useCallback(async () => {
    try {
      const engine = await loadAudioEngine()
      engine.onLoadingChange = setAudioLoading
      engine.onFallback = setAudioFallback
      engine.setVolume(volumeRef.current)
      await engine.start()
      setAudioReady(engine.isStarted)
      await engine.setTimbre(timbre)
    } catch {
      setAudioReady(false)
    }
  }, [timbre])

  useEffect(() => {
    if (audioReady) void loadedAudioEngine()?.setTimbre(timbre)
  }, [timbre, audioReady])

  return { audioReady, audioLoading, audioFallback, enableAudio }
}
