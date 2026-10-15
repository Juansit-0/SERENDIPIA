// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../audio/loader', () => ({
  loadAudioEngine: () => new Promise(() => undefined),
  loadedAudioEngine: () => null,
  prefetchAudioEngine: () => undefined,
}))

// jsdom has no WebGL: the sky is a stub that records which figure it was asked to show.
const shown: number[] = []
vi.mock('./scene', () => ({
  createWelcomeScene: () => ({ show: (step: number) => shown.push(step), setPalette: () => undefined, warp: () => undefined, dispose: () => undefined }),
  sideBySide: () => true,
}))

async function openApp(search = '') {
  window.history.replaceState(null, '', `/${search}`)
  vi.resetModules()
  const { default: App } = await import('../App')
  await act(async () => {
    render(<App />)
  })
}

afterEach(cleanup)
beforeEach(() => {
  localStorage.clear()
  shown.length = 0
})

describe('welcome', () => {
  it('greets a first visit and walks through the six figures', async () => {
    await openApp()
    const dialog = screen.getByRole('dialog', { name: 'Bienvenida a SERENDIPIA' })
    expect(dialog.textContent).toContain('SERENDIPIA')
    fireEvent.click(screen.getByRole('button', { name: 'Comenzar' }))
    expect(screen.getByRole('heading', { name: 'Busca un acorde' })).toBeTruthy()
    fireEvent.keyDown(dialog, { key: 'ArrowRight' })
    fireEvent.keyDown(dialog, { key: 'ArrowRight' })
    expect(screen.getByRole('heading', { name: 'Deja sitio a la casualidad' })).toBeTruthy()
    fireEvent.keyDown(dialog, { key: 'ArrowRight' })
    expect(screen.getByRole('heading', { name: 'Escribe tus canciones' })).toBeTruthy()
    fireEvent.keyDown(dialog, { key: 'ArrowRight' })
    expect(screen.getByRole('heading', { name: 'Afina con las estrellas' })).toBeTruthy()
    expect(shown.at(-1)).toBe(5)
    fireEvent.click(screen.getByRole('button', { name: 'Empezar a tocar' }))
    // The exit plays first: a circle opens onto the app, which assembles itself.
    expect(screen.getByRole('dialog').getAttribute('data-leaving')).toBe('true')
    await act(() => new Promise((resolve) => setTimeout(resolve, 400)))
    expect(document.documentElement.dataset.entrance).toBe('run')
    await act(() => new Promise((resolve) => setTimeout(resolve, 900)))
    expect(screen.queryByRole('dialog', { name: 'Bienvenida a SERENDIPIA' })).toBeNull()
    expect(localStorage.getItem('serendipia.welcome.v1')).not.toBeNull()
  })

  it('can be skipped with Escape and shown again from Ajustes', async () => {
    await openApp()
    // With reduced motion the welcome closes at once.
    const matchMedia = window.matchMedia
    window.matchMedia = ((query: string) => ({ matches: query.includes('reduce'), addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    window.matchMedia = matchMedia
    expect(screen.queryByRole('dialog', { name: 'Bienvenida a SERENDIPIA' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Ajustes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ver la bienvenida' }))
    expect(screen.getByRole('dialog', { name: 'Bienvenida a SERENDIPIA' })).toBeTruthy()
  })

  it('stays away on later visits and when opening a shared link', async () => {
    localStorage.setItem('serendipia.welcome.v1', 'seen')
    localStorage.setItem('serendipia.seen.v1', __APP_VERSION__)
    await openApp()
    expect(screen.queryByRole('dialog', { name: 'Bienvenida a SERENDIPIA' })).toBeNull()
    cleanup()
    localStorage.clear()
    await openApp('?p=Am_F')
    expect(screen.queryByRole('dialog', { name: 'Bienvenida a SERENDIPIA' })).toBeNull()
  })
})
