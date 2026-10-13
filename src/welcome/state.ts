import { useSyncExternalStore } from 'react'

const SEEN_KEY = 'serendipia.welcome.v1'

function seen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) !== null
  } catch {
    return true
  }
}

/** First visit (and not arriving through a shared link, which should open straight on its chords). */
let open: boolean | null = null
const isOpen = () => (open ??= typeof window !== 'undefined' && !seen() && !new URLSearchParams(window.location.search).has('p'))
const listeners = new Set<() => void>()

function set(next: boolean): void {
  open = next
  for (const listener of listeners) listener()
}

/** Shows the welcome again (from Ajustes). */
export function openWelcome(): void {
  set(true)
}

export function closeWelcome(): void {
  try {
    localStorage.setItem(SEEN_KEY, new Date().toISOString())
  } catch {
    // storage unavailable: the welcome may show again next visit
  }
  set(false)
}

export function useWelcomeOpen(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    isOpen,
    () => false,
  )
}
