// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it } from 'vitest'
import { closeHelp } from '../state/help'
import { renderApp } from '../test/renderApp'

afterEach(() => {
  act(() => closeHelp())
  cleanup()
})

describe('¿Cómo se usa?', () => {
  it('opens with ?, walks the topics, and closes with Escape', async () => {
    renderApp()
    fireEvent.keyDown(document.body, { key: '?' })
    const dialog = screen.getByRole('dialog', { name: '¿Cómo se usa?' })
    expect(within(dialog).getByRole('heading', { name: 'Acorde' })).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancionero' }))
    expect(within(dialog).getByText(/toca una palabra y elige su acorde/)).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Acerca de' }))
    expect(within(dialog).getByRole('link', { name: /github.com\/Juansit-0\/SERENDIPIA/ })).toBeTruthy()
    let result: axe.AxeResults | undefined
    await act(async () => {
      result = await axe.run(dialog, { rules: { 'color-contrast': { enabled: false } } })
    })
    expect(result!.violations.map((violation) => violation.id)).toEqual([])
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: '¿Cómo se usa?' })).toBeNull()
  }, 20000)

  it('also opens from Ajustes', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Ajustes' }))
    fireEvent.click(screen.getByRole('button', { name: '¿Cómo se usa?' }))
    expect(screen.getByRole('dialog', { name: '¿Cómo se usa?' })).toBeTruthy()
  })
})

describe('Novedades', () => {
  it('tells a returning player once, and opens the news from the notice', async () => {
    localStorage.clear()
    localStorage.setItem('serendipia.welcome.v1', 'seen')
    localStorage.setItem('serendipia.seen.v1', '1.0.0')
    window.history.replaceState(null, '', '/')
    const { default: App } = await import('../App')
    render(<App />)
    const notice = document.querySelector('.cc-notice') as HTMLElement
    expect(notice.textContent).toContain('SERENDIPIA tiene novedades')
    fireEvent.click(within(notice).getByRole('button', { name: 'Ver novedades' }))
    expect(within(screen.getByRole('dialog', { name: '¿Cómo se usa?' })).getByRole('heading', { name: 'Novedades' })).toBeTruthy()
    expect(localStorage.getItem('serendipia.seen.v1')).toBe(__APP_VERSION__)
  })
})
