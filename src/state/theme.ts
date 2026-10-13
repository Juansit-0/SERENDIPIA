import { useCallback, useEffect, useSyncExternalStore } from 'react'

export type Theme = 'night' | 'day'
/** What the user chose: follow the operating system, or a fixed theme. */
export type ThemePreference = 'auto' | Theme

const STORAGE_KEY = 'serendipia.theme'

function storedPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'night' || value === 'day' ? value : 'auto'
  } catch {
    return 'auto'
  }
}

function systemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'night'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'day' : 'night'
}

function resolve(preference: ThemePreference): Theme {
  return preference === 'auto' ? systemTheme() : preference
}

/** The user's fixed choice wins; «auto» (the default) follows the operating system. */
export function initialTheme(): Theme {
  return resolve(storedPreference())
}

const listeners = new Set<() => void>()
let preference: ThemePreference = typeof document === 'undefined' ? 'auto' : storedPreference()
let current: Theme = typeof document === 'undefined' ? 'night' : resolve(preference)

function notify(): void {
  for (const listener of listeners) listener()
}

function apply(theme: Theme): void {
  current = theme
  if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme
  notify()
}

if (typeof document !== 'undefined') apply(current)

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> }
}

/** Show `theme`, with the eclipse growing out of `origin` when there is one (View Transitions). */
function show(theme: Theme, origin?: HTMLElement | null): void {
  if (theme === current) {
    notify()
    return
  }
  const doc = document as ViewTransitionDocument
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!doc.startViewTransition || reduced || !origin) {
    apply(theme)
    return
  }
  const box = origin.getBoundingClientRect()
  const x = box.left + box.width / 2
  const y = box.top + box.height / 2
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  const root = document.documentElement.style
  root.setProperty('--cc-eclipse-x', `${x}px`)
  root.setProperty('--cc-eclipse-y', `${y}px`)
  root.setProperty('--cc-eclipse-r', `${radius}px`)
  doc.startViewTransition(() => apply(theme))
}

/** Choose «auto» (follow the system again), «day» or «night»; remembered in this browser. */
export function setThemePreference(next: ThemePreference, origin?: HTMLElement | null): void {
  preference = next
  try {
    if (next === 'auto') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // storage unavailable: the choice still works for this visit
  }
  show(resolve(next), origin)
}

/** Fix the theme (the ☾/☀ button): kept for callers that pick a theme directly. */
export function setTheme(theme: Theme, origin?: HTMLElement | null): void {
  setThemePreference(theme, origin)
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useTheme(): {
  theme: Theme
  preference: ThemePreference
  toggle: (origin?: HTMLElement | null) => void
  setPreference: (next: ThemePreference, origin?: HTMLElement | null) => void
} {
  const theme = useSyncExternalStore(subscribe, () => current, () => current)
  const pref = useSyncExternalStore(subscribe, () => preference, () => preference)

  // While on «auto», follow the system live (e.g. macOS switching to dark at sunset).
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: light)')
    if (!query) return
    const onChange = () => {
      if (preference === 'auto') apply(systemTheme())
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const toggle = useCallback(
    (origin?: HTMLElement | null) => setThemePreference(current === 'night' ? 'day' : 'night', origin),
    [],
  )
  return { theme, preference: pref, toggle, setPreference: setThemePreference }
}
