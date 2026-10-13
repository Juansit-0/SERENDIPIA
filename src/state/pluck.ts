import { useSyncExternalStore } from 'react'

/** Which strings were just struck (for the fretboard's ringing strings); `tick` restarts the animation each time. */
export interface Pluck {
  tick: number
  strings: boolean[]
}

let current: Pluck = { tick: 0, strings: [] }
const listeners = new Set<() => void>()

export function emitPluck(frets: (number | null)[]): void {
  current = { tick: current.tick + 1, strings: frets.map((fret) => fret !== null) }
  for (const listener of listeners) listener()
}

export function usePluck(): Pluck {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => current,
    () => current,
  )
}
