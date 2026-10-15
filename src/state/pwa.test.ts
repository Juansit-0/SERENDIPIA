// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function fakePrompt(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const event = new Event('beforeinstallprompt') as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
  event.prompt = vi.fn(async () => undefined)
  event.userChoice = Promise.resolve({ outcome })
  return event
}

let teardown: (() => void) | undefined

describe('installing the app', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    localStorage.clear()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.doUnmock('./notice')
    teardown?.()
  })

  it('keeps the browser prompt to offer it from Ajustes, and installs on demand', async () => {
    const pwa = await import('./pwa')
    teardown = pwa.setupPwa()
    expect(pwa.usePwa).toBeTypeOf('function')
    const event = fakePrompt()
    window.dispatchEvent(event)
    expect(await pwa.promptInstall()).toBe(true)
    expect(event.prompt).toHaveBeenCalledOnce()
    // The prompt can be used once.
    expect(await pwa.promptInstall()).toBe(false)
  })

  it('offers it once, with a notice, to a returning player', async () => {
    localStorage.setItem('serendipia.pwa.v1', JSON.stringify({ visits: 1, offered: false }))
    const shown = vi.fn()
    vi.doMock('./notice', () => ({ showNotice: shown }))
    const pwa = await import('./pwa')
    teardown = pwa.setupPwa()
    window.dispatchEvent(fakePrompt())
    vi.advanceTimersByTime(5000)
    expect(shown).toHaveBeenCalledOnce()
    expect(shown.mock.calls[0][2]?.label).toBe('Instalar')
    expect(JSON.parse(localStorage.getItem('serendipia.pwa.v1')!).offered).toBe(true)
  })

  it('does not nag on a first visit', async () => {
    const shown = vi.fn()
    vi.doMock('./notice', () => ({ showNotice: shown }))
    const pwa = await import('./pwa')
    teardown = pwa.setupPwa()
    window.dispatchEvent(fakePrompt())
    vi.advanceTimersByTime(5000)
    expect(shown).not.toHaveBeenCalled()
  })
})
