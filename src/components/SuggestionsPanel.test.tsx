// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StoreProvider } from '../state/store'
import { SuggestionsPanel } from './SuggestionsPanel'

vi.mock('../audio/loader', () => ({
  loadAudioEngine: () => new Promise(() => undefined),
  loadedAudioEngine: () => null,
  prefetchAudioEngine: () => undefined,
}))

afterEach(cleanup)

function setup() {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
  render(
    <StoreProvider>
      <SuggestionsPanel />
    </StoreProvider>,
  )
  return screen.getByRole('heading', { name: 'Puede seguir' }).closest('section')!
}
const ideas = (panel: HTMLElement) =>
  within(panel)
    .getAllByRole('listitem')
    .map((row) => row.querySelector('.cv-sugp-name')?.textContent ?? '')

describe('"Puede seguir" panel', () => {
  it('follows the last chords of the progression by default', () => {
    const panel = setup()
    expect(within(panel).getByText('G → Am → F')).toBeTruthy()
    expect(ideas(panel)[0]).toMatch(/^I · C/)
    expect(within(panel).getByText(/^Completa «Pop I–V–vi–IV»/)).toBeTruthy()
  })

  it('switches to the selected chord and remembers the choice', () => {
    const panel = setup()
    fireEvent.click(within(panel).getByRole('button', { name: 'Este acorde' }))
    expect(within(panel).getByText('Am7')).toBeTruthy()
    expect(within(panel).queryByText(/^Completa/)).toBeNull()
    expect(JSON.parse(localStorage.getItem('serendipia.settings.v2')!).suggestFrom).toBe('chord')
  })

  it('updates as you add its ideas to the progression', () => {
    const panel = setup()
    fireEvent.click(within(panel).getByRole('button', { name: /^Añadir al patrón: C$|^Añadir a la progresión: C$/ }))
    expect(within(panel).getByText('Am → F → C')).toBeTruthy()
  })

  it('marks each idea with its harmonic function', () => {
    const panel = setup()
    expect(within(panel).getAllByText(/tónica|subdominante|dominante|prestado/i).length).toBeGreaterThan(0)
  })
})
