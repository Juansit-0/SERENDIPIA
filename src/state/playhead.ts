import { useSyncExternalStore } from 'react'

export interface Playhead {
  step: number
  beat: number
  /** Count-in beats still to go before the music (0 when not counting in). */
  count: number
}

const IDLE: Playhead = { step: -1, beat: -1, count: 0 }

let current: Playhead = IDLE
const listeners = new Set<() => void>()

function emit(next: Playhead): void {
  if (next.step === current.step && next.beat === current.beat && next.count === current.count) return
  current = next
  for (const listener of listeners) listener()
}

export const playhead = {
  get: (): Playhead => current,
  setStep: (step: number) => emit({ ...current, step }),
  setBeat: (beat: number) => emit({ ...current, beat }),
  setCount: (count: number) => emit({ ...current, count }),
  reset: () => emit(IDLE),
  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

const getStep = () => current.step
const getBeat = () => current.beat
const getCount = () => current.count

export function usePlayheadStep(): number {
  return useSyncExternalStore(playhead.subscribe, getStep, getStep)
}

export function usePlayheadBeat(): number {
  return useSyncExternalStore(playhead.subscribe, getBeat, getBeat)
}

export function usePlayheadCount(): number {
  return useSyncExternalStore(playhead.subscribe, getCount, getCount)
}
