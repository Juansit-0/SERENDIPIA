// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

afterEach(cleanup)

const panel = () => screen.getByRole('heading', { name: 'Puede seguir' }).closest('section')!
const ideas = () =>
  within(panel())
    .getAllByRole('button', { pressed: false })
    .concat(within(panel()).queryAllByRole('button', { pressed: true }))
    .filter((button) => button.classList.contains('sheet'))
    .map((button) => button.querySelector('.fv-ui')?.textContent)

describe('"Puede seguir" panel', () => {
  it('follows the last chords of the progression by default', () => {
    renderApp()
    expect(within(panel()).getByText('G → Am → F')).toBeTruthy()
    expect(ideas()[0]).toBe('I · C')
    expect(within(panel()).getByText(/^Completa «Pop I–V–vi–IV»/)).toBeTruthy()
  })

  it('switches to the selected chord and remembers the choice', () => {
    renderApp()
    fireEvent.click(within(panel()).getByRole('button', { name: 'Este acorde' }))
    expect(within(panel()).getByText('Am7')).toBeTruthy()
    expect(within(panel()).queryByText(/^Completa/)).toBeNull()
    expect(JSON.parse(localStorage.getItem('serendipia.settings.v2')!).suggestFrom).toBe('chord')
  })

  it('updates as you add its ideas to the progression', () => {
    renderApp()
    fireEvent.click(within(panel()).getByRole('button', { name: 'Añadir al patrón: C' }))
    expect(within(panel()).getByText('Am → F → C')).toBeTruthy()
  })

  it('falls back to the selected chord without a progression', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }))
    expect(within(panel()).queryByRole('group', { name: 'Basar las sugerencias en' })).toBeNull()
    expect(within(panel()).getByText('Am7')).toBeTruthy()
  })

  it('is the same panel in the Theory view', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Teoría' }))
    expect(within(panel()).getByText('G → Am → F')).toBeTruthy()
  })
})
