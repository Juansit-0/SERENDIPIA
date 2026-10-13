import { decodeShare, encodeShare, type SharedStep } from './share'

export const SESSION_KEY = 'serendipia.session.v1'

/**
 * The progression being worked on, kept between visits so a reload never loses it.
 * Returns null when nothing was kept yet (first visit), [] when the player left it empty.
 */
export function loadSessionSteps(): SharedStep[] | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw === null) return null
    if (raw === '') return []
    return decodeShare(raw)?.steps ?? null
  } catch {
    return null
  }
}

export function saveSessionSteps(steps: SharedStep[]): void {
  try {
    localStorage.setItem(SESSION_KEY, steps.length === 0 ? '' : encodeShare({ steps }))
  } catch {
    return
  }
}
