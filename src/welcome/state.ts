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
const isOpen = () => (open ??= typeof window !== 'undefined' && !seen() && !['p', 'song', 'sheet'].some((key) => new URLSearchParams(window.location.search).has(key)))
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

/**
 * The app assembling itself as the welcome opens onto it: `html[data-entrance]` drives the CSS entrance
 * (top bar down, modules up, strip stars landing) and clears itself once it has played.
 */
export function startEntrance(ms = 2200): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.entrance = 'run'
  window.setTimeout(() => {
    if (root.dataset.entrance === 'run') delete root.dataset.entrance
  }, ms)
}
