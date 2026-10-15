import { useSyncExternalStore } from 'react'
import { showNotice } from './notice'

/*
 * SERENDIPIA as an installed app: the browser's install prompt (Chrome, Edge, Android) is kept to be offered from
 * Ajustes and, once, from a notice on a return visit; Safari on iPhone gets the steps instead; a new version
 * waiting in the service worker is announced with «Recargar».
 */

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY = 'serendipia.pwa.v1'

type Lang = 'es' | 'en'

const TEXT = {
  es: {
    offer: 'Instala SERENDIPIA como app: abre sin navegador y funciona sin conexión.',
    install: 'Instalar',
    update: 'Hay una versión nueva de SERENDIPIA.',
    reload: 'Recargar',
  },
  en: {
    offer: 'Install SERENDIPIA as an app: it opens without the browser and works offline.',
    install: 'Install',
    update: 'A new version of SERENDIPIA is ready.',
    reload: 'Reload',
  },
} as const

let deferred: InstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
let snapshot = { canPrompt: false, installed: false }

function emit(): void {
  snapshot = { canPrompt: deferred !== null, installed }
  for (const listener of listeners) listener()
}

function lang(): Lang {
  try {
    const settings = JSON.parse(localStorage.getItem('serendipia.settings.v2') ?? '{}') as { lang?: string }
    if (settings.lang === 'en' || settings.lang === 'es') return settings.lang
  } catch {
    // no settings yet
  }
  // Same default as the app's settings.
  return 'es'
}

function readState(): { visits: number; offered: boolean } {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as { visits?: number; offered?: boolean }
    return { visits: value.visits ?? 0, offered: value.offered ?? false }
  } catch {
    return { visits: 0, offered: false }
  }
}

function writeState(state: { visits: number; offered: boolean }): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage unavailable: the offer may come again, that is all
  }
}

/** Running as an installed app (any platform). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(
    window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone,
  )
}

/** Safari on iPhone/iPad, where installing is «Compartir → Añadir a pantalla de inicio». */
export function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
  return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
}

export async function promptInstall(): Promise<boolean> {
  const event = deferred
  if (!event) return false
  deferred = null
  emit()
  await event.prompt()
  const { outcome } = await event.userChoice
  return outcome === 'accepted'
}

/** Call once at start-up; returns what undoes it (for tests). */
export function setupPwa(): () => void {
  if (typeof window === 'undefined') return () => undefined
  installed = isStandalone()
  const state = readState()
  state.visits += 1
  writeState(state)

  const onPrompt = (event: Event) => {
    event.preventDefault()
    deferred = event as InstallPromptEvent
    emit()
    // A returning player gets the offer once; Ajustes keeps it afterwards.
    const now = readState()
    if (now.visits >= 2 && !now.offered && !installed) {
      writeState({ ...now, offered: true })
      const text = TEXT[lang()]
      window.setTimeout(() => showNotice(text.offer, 12000, { label: text.install, run: () => void promptInstall() }), 4000)
    }
  }
  const onInstalled = () => {
    installed = true
    deferred = null
    emit()
  }
  window.addEventListener('beforeinstallprompt', onPrompt)
  window.addEventListener('appinstalled', onInstalled)
  emit()
  return () => {
    window.removeEventListener('beforeinstallprompt', onPrompt)
    window.removeEventListener('appinstalled', onInstalled)
  }
}

/**
 * The service worker: registered once the page has loaded; when a newer version takes over a page that was
 * already running one, the player is offered to reload into it.
 */
export function registerWorker(url: string, scope: string): void {
  if (!('serviceWorker' in navigator)) return
  const hadController = Boolean(navigator.serviceWorker.controller)
  let announced = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || announced) return
    announced = true
    const text = TEXT[lang()]
    showNotice(text.update, 20000, { label: text.reload, run: () => window.location.reload() })
  })
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(url, { scope }).catch(() => undefined)
  })
}

export function usePwa(): { canPrompt: boolean; installed: boolean } {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => snapshot,
    () => snapshot,
  )
}
