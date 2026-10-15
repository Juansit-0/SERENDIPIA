import { useSyncExternalStore } from 'react'
import type { HelpSectionId } from '../i18n/help'

/** Whether the help panel is open, and on which topic. */
let current: HelpSectionId | null = null
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

export function openHelp(section: HelpSectionId = 'chord'): void {
  current = section
  emit()
}

export function closeHelp(): void {
  current = null
  emit()
}

export function useHelp(): HelpSectionId | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => current,
    () => null,
  )
}

const SEEN_KEY = 'serendipia.seen.v1'

/** major.minor of a version, as a comparable number (2.24.1 → 2024). */
const minorOf = (version: string) => {
  const [major = 0, minor = 0] = version.split('.').map(Number)
  return major * 1000 + minor
}

/**
 * «Novedades»: true once per new minor version for someone who already used the app. A first visit only
 * records the version (the welcome tells the rest).
 */
export function hasNews(version: string, firstVisit: boolean): boolean {
  let seen: string | null = null
  try {
    seen = localStorage.getItem(SEEN_KEY)
    localStorage.setItem(SEEN_KEY, version)
  } catch {
    return false
  }
  if (firstVisit) return false
  return seen === null || minorOf(version) > minorOf(seen)
}
