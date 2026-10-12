import { useCallback, useEffect, useSyncExternalStore } from 'react'

export type Theme = 'night' | 'day'

const STORAGE_KEY = 'serendipia.theme'

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'night' || value === 'day' ? value : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'night'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'day' : 'night'
}

/** The user's explicit choice wins; otherwise follow the operating system. */
export function initialTheme(): Theme {
  return storedTheme() ?? systemTheme()
}

const listeners = new Set<() => void>()
let current: Theme = typeof document === 'undefined' ? 'night' : initialTheme()

function apply(theme: Theme): void {
  current = theme
  if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme
  for (const listener of listeners) listener()
}

if (typeof document !== 'undefined') apply(current)

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> }
}

/**
 * The eclipse: switches theme with a circular reveal growing out of `origin`
 * (View Transitions API). Instant without the API or with reduced motion.
 */
export function setTheme(theme: Theme, origin?: HTMLElement | null): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // storage unavailable: the switch still works for this visit
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

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useTheme(): { theme: Theme; toggle: (origin?: HTMLElement | null) => void } {
  const theme = useSyncExternalStore(subscribe, () => current, () => current)

  // Follow the system while the user has not chosen explicitly.
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: light)')
    if (!query) return
    const onChange = () => {
      if (!storedTheme()) apply(systemTheme())
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const toggle = useCallback((origin?: HTMLElement | null) => setTheme(current === 'night' ? 'day' : 'night', origin), [])
  return { theme, toggle }
}
