import type { audioEngine as Engine } from './engine'

export type AudioEngine = typeof Engine

let engine: AudioEngine | null = null
let pending: Promise<AudioEngine> | null = null

export function loadAudioEngine(): Promise<AudioEngine> {
  pending ??= import('./engine').then((module) => {
    engine = module.audioEngine
    return engine
  })
  return pending
}

export function loadedAudioEngine(): AudioEngine | null {
  return engine
}

export function prefetchAudioEngine(): void {
  if (typeof window === 'undefined') return
  const idle = window.requestIdleCallback ?? ((callback: () => void) => window.setTimeout(callback, 1200))
  idle(() => void loadAudioEngine().catch(() => undefined))
}
