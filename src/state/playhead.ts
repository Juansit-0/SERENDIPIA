import { useSyncExternalStore } from 'react'

export interface Playhead {
  step: number
  beat: number
}

const IDLE: Playhead = { step: -1, beat: -1 }

let current: Playhead = IDLE
const listeners = new Set<() => void>()

function emit(next: Playhead): void {
  if (next.step === current.step && next.beat === current.beat) return
  current = next
  for (const listener of listeners) listener()
}

export const playhead = {
  get: (): Playhead => current,
  setStep: (step: number) => emit({ ...current, step }),
  setBeat: (beat: number) => emit({ ...current, beat }),
  reset: () => emit(IDLE),
  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

const getStep = () => current.step
const getBeat = () => current.beat

export function usePlayheadStep(): number {
  return useSyncExternalStore(playhead.subscribe, getStep, getStep)
}

export function usePlayheadBeat(): number {
  return useSyncExternalStore(playhead.subscribe, getBeat, getBeat)
}
