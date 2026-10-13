// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

afterEach(cleanup)

describe('top bar', () => {
  it('shows the view tabs and switches view with aria-current', () => {
    renderApp()
    const nav = screen.getByRole('navigation', { name: 'Vistas' })
    const tabs = within(nav).getAllByRole('button')
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Acorde', 'Teoría', 'Práctica'])
    expect(tabs[0].getAttribute('aria-current')).toBe('page')
    fireEvent.click(tabs[1])
    expect(tabs[1].getAttribute('aria-current')).toBe('page')
    expect(tabs[0].getAttribute('aria-current')).toBeNull()
  })

  it('has the primary run button and tempo steppers', () => {
    renderApp()
    const run = screen.getByRole('button', { name: 'Correr' })
    expect(run.className).toMatch(/cc-btn--primary/)
    const before = Number(screen.getByRole('group', { name: 'Tempo' }).textContent!.match(/\d+/)![0])
    fireEvent.click(screen.getByRole('button', { name: 'Subir tempo' }))
    const after = Number(screen.getByRole('group', { name: 'Tempo' }).textContent!.match(/\d+/)![0])
    expect(after).toBe(before + 4)
  })

  it('opens and closes popovers with click, Escape and outside click', () => {
    renderApp()
    const trigger = screen.getByRole('button', { name: 'Reproducción' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    const dialog = screen.getByRole('dialog', { name: 'Reproducción' })
    fireEvent.click(within(dialog).getByRole('button', { name: '8' }))
    expect(within(dialog).getByRole('button', { name: '8' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)

    fireEvent.click(trigger)
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('sets the key from the 12-root grid and closes', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: /^Tonalidad:/ }))
    const dialog = screen.getByRole('dialog', { name: 'Tonalidad' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'D / Re' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: /^Tonalidad: D / })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /^Tonalidad:/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Menor' }))
    expect(screen.getByRole('button', { name: 'Menor' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Tonalidad automática según la progresión' })).toBeTruthy()
  })

  it('offers sound activation and the settings popover switches language', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Sonido' }))
    expect(screen.getByRole('button', { name: 'Activar sonido' })).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Ajustes' }))
    fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(screen.getByRole('button', { name: 'Run' })).toBeTruthy()
  })

  it('toggles the theme', () => {
    renderApp()
    const toggle = screen.getByRole('button', { name: /^Cambiar a/ })
    const start = document.documentElement.dataset.theme
    fireEvent.click(toggle)
    const next = document.documentElement.dataset.theme
    expect(next).not.toBe(start)
    const label = next === 'day' ? 'Cambiar a noche' : 'Cambiar a día'
    const again = screen.getByRole('button', { name: label })
    expect(again.getAttribute('aria-pressed')).toBe(String(next === 'day'))
    fireEvent.click(again)
    expect(document.documentElement.dataset.theme).toBe(start)
  })
})

describe('theme preference in Ajustes', () => {
  it('chooses Automático, Día or Noche and can go back to following the system', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Ajustes' }))
    const group = screen.getByRole('group', { name: 'Tema' })
    const option = (name: string) => within(group).getByRole('button', { name })
    fireEvent.click(option('Noche'))
    expect(document.documentElement.dataset.theme).toBe('night')
    expect(option('Noche').getAttribute('aria-pressed')).toBe('true')
    expect(localStorage.getItem('serendipia.theme')).toBe('night')
    fireEvent.click(option('Día'))
    expect(document.documentElement.dataset.theme).toBe('day')
    fireEvent.click(option('Automático'))
    expect(option('Automático').getAttribute('aria-pressed')).toBe('true')
    expect(localStorage.getItem('serendipia.theme')).toBeNull()
  })

  it('credits the CC BY-SA guitar samples with links', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Ajustes' }))
    expect(screen.getByRole('link', { name: 'licencia CC BY-SA 3.0' }).getAttribute('href')).toBe(
      'https://creativecommons.org/licenses/by-sa/3.0/',
    )
    expect(screen.getByRole('link', { name: 'gleitz/midi-js-soundfonts' })).toBeTruthy()
  })
})

describe('folded top bar on phones', () => {
  it('starts folded and opens on demand', () => {
    renderApp()
    const more = screen.getByRole('button', { name: /^Más/ })
    const rest = document.getElementById('topbar-more')!
    expect(more.getAttribute('aria-expanded')).toBe('false')
    expect(more.getAttribute('aria-controls')).toBe('topbar-more')
    expect(rest.className).toMatch(/(^|\s)hidden(\s|$)/)
    expect(screen.getByRole('button', { name: 'Correr' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Subir tempo' })).toBeTruthy()

    fireEvent.click(more)
    expect(more.getAttribute('aria-expanded')).toBe('true')
    expect(rest.className).not.toMatch(/(^|\s)hidden(\s|$)/)
    expect(localStorage.getItem('serendipia.transportOpen')).toBe('1')
  })
})
