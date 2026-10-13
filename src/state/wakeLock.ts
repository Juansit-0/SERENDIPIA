import { useEffect } from 'react'

type WakeLockSentinel = { release: () => Promise<void>; released: boolean }
type WakeLockNavigator = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> } }

/**
 * Keeps the screen on while `active` (playing, or practising with the guitar in hand), so the phone does not dim
 * mid-song. The browser drops the lock when the tab is hidden; it is asked for again on return.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    const wakeLock = (navigator as WakeLockNavigator).wakeLock
    if (!active || !wakeLock) return
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false
    const acquire = () => {
      if (document.visibilityState !== 'visible' || (sentinel && !sentinel.released)) return
      wakeLock
        .request('screen')
        .then((lock) => {
          if (cancelled) void lock.release()
          else sentinel = lock
        })
        .catch(() => undefined)
    }
    acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', acquire)
      void sentinel?.release().catch(() => undefined)
    }
  }, [active])
}
