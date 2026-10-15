// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProgressionOptions } from '../audio/types'
import { encodeSheetLink } from '../state/sheets'

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
  preloadBand: () => undefined,
  playFrets: () => undefined,
}
vi.mock('../audio/loader', () => ({
  loadAudioEngine: async () => engine,
  loadedAudioEngine: () => engine,
  prefetchAudioEngine: () => undefined,
}))

afterEach(cleanup)
beforeEach(() => {
  options = null
  localStorage.clear()
  localStorage.setItem('serendipia.welcome.v1', 'seen')
    localStorage.setItem('serendipia.seen.v1', __APP_VERSION__)
})

async function open(search = '') {
  window.history.replaceState(null, '', `/${search}#songbook`)
  const { resetSongLinkForTests } = await import('../state/store')
  resetSongLinkForTests()
  const { default: App } = await import('../App')
  render(<App />)
}

const chordsShown = () => Array.from(document.querySelectorAll('.sb-body .sb-chord')).map((node) => node.textContent?.trim()).filter((text) => text)

describe('Cancionero', () => {
  it('starts with an invitation, then writes and shows chords over the lyrics', async () => {
    await open()
    fireEvent.click(screen.getByRole('button', { name: /Crear mi primera canción/ }))
    fireEvent.change(screen.getByLabelText('Letra con acordes (ChordPro)'), { target: { value: '{title: Prueba}\n[C]Hoy el [G]cielo [Am]tiene [F]luz' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ver' }))
    expect(chordsShown()).toEqual(['C', 'G', 'Am', 'F'])
    expect(document.querySelector('.sb-body .sb-line')?.textContent).toContain('Hoy el')
    // No strip under the songbook.
    expect(document.querySelector('.strip')).toBeNull()
  }, 20000)

  it('plays chord by chord with the lyrics following, transposes and takes the chords to the progression', async () => {
    localStorage.setItem('serendipia.sheets.v1', JSON.stringify([{ id: 's1', name: 'Luz', text: '[C]Hoy el [G]cielo\n[Am]tiene [F]luz', savedAt: '' }]))
    await open()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Tocar/ }))
    })
    expect(options?.stepCount).toBe(4)
    expect(options?.getBass?.(1)).toBe(7)
    act(() => options!.onStep(2))
    expect(document.querySelector('[data-live="true"] .sb-chord')?.textContent).toBe('Am')
    // The sheet's own stop (the top bar's Run also reads «Parar» while playing).
    fireEvent.click(within(document.querySelector('.sb-tools') as HTMLElement).getByRole('button', { name: 'Parar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Subir un semitono' }))
    fireEvent.click(screen.getByRole('button', { name: 'Subir un semitono' }))
    expect(chordsShown()).toEqual(['D', 'A', 'Bm', 'G'])
    fireEvent.click(screen.getByRole('button', { name: 'A la progresión' }))
    expect(localStorage.getItem('serendipia.session.v1')).toContain('D_A_Bm_G')
  }, 20000)

  it('a shared sheet link adds the song to the songbook', async () => {
    const link = encodeSheetLink({ id: 'x', name: 'De un amigo', text: '[Em]Cae la [C]tarde', savedAt: '' })
    await open(`?sheet=${link}`)
    expect(screen.getByRole('heading', { name: 'De un amigo' })).toBeTruthy()
    expect(document.querySelector('.cc-notice')?.textContent).toContain('Añadida al Cancionero')
    expect(window.location.search).toBe('')
  }, 20000)

  it('places chords by tapping words, without typing brackets', async () => {
    await open()
    fireEvent.click(screen.getByRole('button', { name: /Crear mi primera canción/ }))
    fireEvent.change(screen.getByLabelText('Letra con acordes (ChordPro)'), { target: { value: 'Hoy el cielo tiene luz' } })
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente: poner acordes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Acorde para «Hoy»' }))
    const palette = screen.getByRole('dialog', { name: 'Acorde para «Hoy»' })
    // C major is the key in view: its chords are offered.
    fireEvent.click(within(within(palette).getByRole('group', { name: 'De la tonalidad' })).getByRole('button', { name: 'C' }))
    fireEvent.click(screen.getByRole('button', { name: 'Acorde para «cielo»' }))
    fireEvent.change(screen.getByLabelText('Otro'), { target: { value: 'Em7' } })
    fireEvent.click(screen.getByRole('button', { name: 'Poner' }))
    expect(JSON.parse(localStorage.getItem('serendipia.sheets.v1')!)[0].text).toBe('[C]Hoy el [Em7]cielo tiene luz')
    // The song's own chords come first next time; a placed chord can be taken off.
    fireEvent.click(screen.getByRole('button', { name: 'Acorde para «cielo»: Em7' }))
    expect(within(screen.getByRole('group', { name: 'En esta canción' })).getAllByRole('button').map((b) => b.textContent)).toEqual(['C', 'Em7'])
    fireEvent.click(screen.getByRole('button', { name: 'Quitar acorde' }))
    expect(JSON.parse(localStorage.getItem('serendipia.sheets.v1')!)[0].text).toBe('[C]Hoy el cielo tiene luz')
  }, 20000)

  it('a song pasted with the chords on top gets them placed over the lyrics', async () => {
    await open()
    fireEvent.click(screen.getByRole('button', { name: /Crear mi primera canción/ }))
    const area = screen.getByLabelText('Letra con acordes (ChordPro)') as HTMLTextAreaElement
    fireEvent.paste(area, { clipboardData: { getData: () => 'G        D\nCae la tarde lenta' } })
    expect(JSON.parse(localStorage.getItem('serendipia.sheets.v1')!)[0].text).toBe('[G]Cae la ta[D]rde lenta')
    expect(document.querySelector('.cc-notice')?.textContent).toContain('Coloqué los acordes')
  }, 20000)
})
