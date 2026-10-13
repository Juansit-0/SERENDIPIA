// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import App from '../App'
import { renderApp } from '../test/renderApp'

afterEach(cleanup)

const openMenu = () => fireEvent.click(screen.getByRole('button', { name: 'Acciones de la progresión' }))

const stepNames = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-step-index]')).map(
    (step) => step.querySelector('.strip-name')?.textContent,
  )

function removeStep(index: number) {
  fireEvent.click(document.querySelector(`[data-step-index="${index}"]`)!, { altKey: true })
}

describe('undo and redo', () => {
  it('walks back and forth through progression edits', () => {
    renderApp()
    expect(screen.getByRole('button', { name: 'Deshacer' })).toHaveProperty('disabled', true)
    removeStep(3)
    removeStep(0)
    expect(stepNames()).toEqual(['G', 'Am'])
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }))
    expect(stepNames()).toEqual(['C', 'G', 'Am'])
    fireEvent.keyDown(window, { key: 'z', metaKey: true })
    expect(stepNames()).toEqual(['C', 'G', 'Am', 'F'])
    fireEvent.keyDown(window, { key: 'z', metaKey: true, shiftKey: true })
    expect(stepNames()).toEqual(['C', 'G', 'Am'])
    fireEvent.keyDown(window, { key: 'y', ctrlKey: true })
    expect(stepNames()).toEqual(['G', 'Am'])
    expect(screen.getByRole('button', { name: 'Rehacer' })).toHaveProperty('disabled', true)
  })
})

describe('library', () => {
  it('saves the progression under a name and loads it back', () => {
    renderApp()
    openMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar…' }))
    fireEvent.change(screen.getByLabelText('Nombre de la progresión'), { target: { value: 'Verso' } })
    fireEvent.submit(screen.getByLabelText('Nombre de la progresión').closest('form')!)
    expect(screen.getByText('Verso')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Volver al menú' }))
    expect(screen.getByRole('button', { name: 'Mis progresiones (1)' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Mis progresiones (1)' }))

    removeStep(0)
    removeStep(0)
    expect(stepNames()).toEqual(['Am', 'F'])
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(stepNames()).toEqual(['C', 'G', 'Am', 'F'])

    // Deleting takes a second tap.
    fireEvent.click(screen.getByRole('button', { name: 'Borrar: Verso' }))
    expect(screen.getByText('Verso')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '¿Borrar?: Verso' }))
    expect(screen.getByText('Aún no guardaste ninguna progresión.')).toBeTruthy()
  })

  it('imports a backup file into the library', async () => {
    renderApp()
    openMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Mis progresiones (0)' }))
    const backup = JSON.stringify({ app: 'serendipia', version: 1, entries: [{ name: 'Mi favorita', savedAt: '', data: 'p=Am_F_C_G' }] })
    const input = document.querySelector<HTMLInputElement>('.strip-menu__backup input[type="file"]')!
    await act(async () => {
      fireEvent.change(input, { target: { files: [new File([backup], 'serendipia.json', { type: 'application/json' })] } })
    })
    expect(screen.getByText('Mi favorita')).toBeTruthy()
    expect(document.querySelector('.strip-menu__note')?.textContent).toBe('Progresiones importadas: 1')
  })
})

describe('kept progression', () => {
  it('a reload brings back the progression being worked on', () => {
    const { unmount } = renderApp()
    removeStep(0)
    expect(stepNames()).toEqual(['G', 'Am', 'F'])
    unmount()
    render(<App />)
    expect(stepNames()).toEqual(['G', 'Am', 'F'])
  })
})

describe('progression menu', () => {
  it('opens from the more button and closes with Escape or a press outside', () => {
    renderApp()
    const more = screen.getByRole('button', { name: 'Acciones de la progresión' })
    expect(more.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(more)
    expect(more.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('button', { name: 'Vaciar progresión' })).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('button', { name: 'Vaciar progresión' })).toBeNull()
    fireEvent.click(more)
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('button', { name: 'Vaciar progresión' })).toBeNull()
  })

  it('clears the whole progression', () => {
    renderApp()
    openMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Vaciar progresión' }))
    expect(stepNames()).toEqual([])
  })
})

describe('share links', () => {
  it('copies a link that rebuilds the progression', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(async () => undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    renderApp()
    openMenu()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Compartir enlace' }))
    })
    const url = writeText.mock.calls[0][0]
    expect(decodeURIComponent(url)).toContain('?p=C_G_Am_F&t=92&b=4&c=0&s=single')
    expect((screen.getByLabelText('Copia este enlace') as HTMLInputElement).value).toBe(url)
  })

  it('opens a shared link with its chords and settings', () => {
    renderApp('?p=Dm7_G7_Cmaj7:x-3-2-0-0-0&t=120&b=2')
    expect(stepNames()).toEqual(['Dm7', 'G7', 'Cmaj7'])
    expect(screen.getByText('120')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /^Reproducción/ }))
    expect(screen.getAllByRole('button', { name: '2' }).some((button) => button.getAttribute('aria-pressed') === 'true')).toBe(true)
    // The query is dropped so a reload keeps the player's own edits.
    expect(window.location.search).toBe('')
  })
})
