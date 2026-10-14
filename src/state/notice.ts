import { useSyncExternalStore } from 'react'

/** A short message shown for a few seconds above the strip (e.g. «Canción añadida»). */
let current: { text: string; id: number } | null = null
const listeners = new Set<() => void>()
let timer: number | undefined

function emit(): void {
  for (const listener of listeners) listener()
}

export function showNotice(text: string, ms = 5000): void {
  current = { text, id: (current?.id ?? 0) + 1 }
  emit()
  if (typeof window === 'undefined') return
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    current = null
    emit()
  }, ms)
}

export function dismissNotice(): void {
  window.clearTimeout(timer)
  current = null
  emit()
}

export function useNotice(): { text: string; id: number } | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => current,
    () => null,
  )
}
