// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ProgressionOptions } from '../../audio/types'

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
  stopProgression: () => undefined,
}
vi.mock('../../audio/loader', () => ({
  loadAudioEngine: async () => engine,
  loadedAudioEngine: () => engine,
  prefetchAudioEngine: () => undefined,
}))

afterEach(cleanup)

describe('Acompañamiento', () => {
  it('plays bass and drums in the chosen style, the bass on each chord’s root', async () => {
    localStorage.clear()
    localStorage.setItem('serendipia.welcome.v1', 'seen')
    localStorage.setItem('serendipia.seen.v1', __APP_VERSION__)
    window.history.replaceState(null, '', '/')
    const { default: App } = await import('../../App')
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /^Reproducción/ }))
    fireEvent.change(screen.getByLabelText('Acompañamiento'), { target: { value: 'bossa' } })
    expect(JSON.parse(localStorage.getItem('serendipia.settings.v2')!).backing).toBe('bossa')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Correr/ }))
    })
    expect(options?.getBacking?.()).toBe('bossa')
    // C G Am F: roots C, G, A, F.
    expect([0, 1, 2, 3].map((index) => options?.getBass?.(index))).toEqual([0, 7, 9, 5])
    // Changing the style while playing applies from the next chord: the engine reads it each step.
    fireEvent.change(screen.getByLabelText('Acompañamiento'), { target: { value: 'rock' } })
    expect(options?.getBacking?.()).toBe('rock')
  }, 20000)
})
