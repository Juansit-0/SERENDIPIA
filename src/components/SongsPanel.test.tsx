// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ProgressionOptions } from '../audio/types'

// A stand-in engine: playback starts at once and the test drives the steps.
let options: ProgressionOptions | null = null
const engine = {
  isStarted: true,
  onLoadingChange: null,
  onFallback: null,
  setVolume: () => undefined,
  start: async () => undefined,
  setTimbre: async () => undefined,
  playProgression: (next: ProgressionOptions) => {
    options = next
  },
  updateProgression: () => undefined,
  stopProgression: () => {
    options = null
  },
}
vi.mock('../audio/loader', () => ({
  loadAudioEngine: async () => engine,
  loadedAudioEngine: () => engine,
  prefetchAudioEngine: () => undefined,
}))

afterEach(cleanup)

const stepNames = () => Array.from(document.querySelectorAll<HTMLElement>('[data-step-index]')).map((step) => step.querySelector('.strip-name')?.textContent)

async function openSongs() {
  localStorage.clear()
  localStorage.setItem('serendipia.welcome.v1', 'seen')
  localStorage.setItem('serendipia.library.v1', JSON.stringify([{ id: 'v', name: 'Verso', savedAt: '', data: 'p=Am_F' }]))
  window.history.replaceState(null, '', '/')
  const { default: App } = await import('../App')
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Acciones de la progresión' }))
  fireEvent.click(screen.getByRole('button', { name: 'Canciones (0)' }))
}

describe('songs panel', () => {
  it('builds a song from saved and current progressions, plays it section by section and gives the progression back', async () => {
    await openSongs()
    fireEvent.click(screen.getByRole('button', { name: /Nueva canción/ }))
    fireEvent.change(screen.getByPlaceholderText('p. ej. Mi canción'), { target: { value: 'Prueba' } })
    fireEvent.change(screen.getByLabelText('Añadir sección desde'), { target: { value: 'v' } })
    fireEvent.click(screen.getByRole('button', { name: 'Añadir' }))
    fireEvent.click(screen.getByRole('button', { name: 'Una vez más' }))
    fireEvent.change(screen.getByLabelText('Añadir sección desde'), { target: { value: '__current' } })
    fireEvent.click(screen.getByRole('button', { name: 'Añadir' }))
    expect((screen.getByLabelText('Sección 2') as HTMLSelectElement).value).toBe('chorus')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar canción' }))

    const row = screen.getByText('Prueba').closest('li')!
    expect(row.textContent).toContain('Verso ×2 · Coro')
    await act(async () => {
      fireEvent.click(within(row).getByRole('button', { name: 'Tocar' }))
    })
    expect(options?.stepCount).toBe(8)
    expect(stepNames()).toEqual(['Am', 'F'])
    act(() => options!.onStep(4))
    expect(stepNames()).toEqual(['C', 'G', 'Am', 'F'])
    expect(document.querySelector('.strip__song')?.textContent).toContain('Prueba · Coro')
    // Looping back to the verse, then stopping: the player's own progression returns.
    act(() => options!.onStep(0))
    expect(stepNames()).toEqual(['Am', 'F'])

    fireEvent.click(within(screen.getByText('Prueba').closest('li')!).getByRole('button', { name: 'Detener' }))
    expect(stepNames()).toEqual(['C', 'G', 'Am', 'F'])
    expect(document.querySelector('.strip__song')).toBeNull()
  }, 15000)
})
