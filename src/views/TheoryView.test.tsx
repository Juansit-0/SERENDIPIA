// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

afterEach(cleanup)

function openTheory() {
  renderApp()
  fireEvent.click(screen.getByRole('button', { name: 'Teoría' }))
}

describe('theory view', () => {
  it('shows the key read-only and no root or mode pickers', () => {
    openTheory()
    expect(screen.getByRole('heading', { name: 'Tonalidad: C mayor' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Mayor' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Tríadas' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('selects a degree and adds it to the progression with the plus button', () => {
    openTheory()
    const before = screen.queryAllByText('F').length
    const card = screen.getByRole('button', { name: 'IV F' })
    fireEvent.click(card)
    expect(card.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Añadir F a la progresión' }))
    expect(screen.queryAllByText('F').length).toBeGreaterThan(before)
  })

  it('switches degrees to sevenths', () => {
    openTheory()
    fireEvent.click(screen.getByRole('button', { name: 'Séptimas' }))
    expect(screen.getByRole('button', { name: 'V7 G7' })).toBeTruthy()
  })

  it('loads a classic progression with Usar', () => {
    openTheory()
    const list = screen.getByRole('region', { name: 'Progresiones clásicas' })
    const buttons = within(list).getAllByRole('button', { name: /^Usar la progresión/ })
    expect(buttons.length).toBeGreaterThan(3)
    // «Doo-wop» I–vi–IV–V in C: the loaded progression ends on G, so the key stays and the list is still there.
    fireEvent.click(buttons[1])
    expect(screen.getByRole('heading', { name: 'Tonalidad: C mayor' })).toBeTruthy()
    expect(within(list).getAllByRole('button', { name: /^Usar la progresión/ }).length).toBe(buttons.length)
  })
})
