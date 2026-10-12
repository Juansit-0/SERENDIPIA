// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

afterEach(cleanup)

const board = () => screen.getAllByRole('group', { name: /mástil/i })[0]
const cell = (label: string) => within(board()).getByRole('button', { name: new RegExp(`^${label}$`) })
const input = () => document.getElementById('chord-input') as HTMLInputElement
const type = (value: string) => fireEvent.change(input(), { target: { value } })
const hero = () => document.querySelector('.cc-hero')?.textContent

describe('Acorde view', () => {
  it('shows the typed chord on the fretboard and in the hero', () => {
    renderApp()
    type('C')
    expect(hero()).toBe('C')
    // C open shape: A string at fret 3, D at 2.
    expect(cell('A traste 3').getAttribute('aria-pressed')).toBe('true')
    expect(cell('D traste 2').getAttribute('aria-pressed')).toBe('true')
  })

  it('names the chord that the marked frets make', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Borrar marcas' }))
    expect(screen.getByText('Escribe un acorde o marca trastes')).toBeTruthy()
    for (const label of ['A traste 3', 'D traste 2', 'B traste 1']) fireEvent.click(cell(label))
    expect(hero()).toBeTruthy()
    expect(input().value).toBe(hero())
  })

  it('offers alternative names and picks one', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Borrar marcas' }))
    for (const label of ['A traste 3', 'D traste 2', 'G traste 5']) fireEvent.click(cell(label))
    const group = screen.getByRole('group', { name: 'También podría ser' })
    const alt = within(group).getAllByRole('button')[0]
    const before = hero()
    fireEvent.click(alt)
    expect(hero()).toBe(alt.textContent)
    expect(hero()).not.toBe(before)
  })

  it('says when the marks make no known chord and clears them', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Borrar marcas' }))
    fireEvent.click(cell('A traste 3'))
    expect(screen.getByText('Ningún acorde reconocible')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Añadir a la progresión' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Borrar marcas' }))
    expect(screen.getByText('Escribe un acorde o marca trastes')).toBeTruthy()
    expect(within(board()).queryAllByRole('button', { pressed: true }).length).toBe(0)
  })

  it('has Escuchar and adds the chord to the progression', () => {
    renderApp()
    expect(screen.getByRole('button', { name: 'Escuchar' })).toBeTruthy()
    const count = () => screen.getAllByText(/\/16/).length
    const before = document.body.textContent
    type('G')
    fireEvent.click(screen.getByRole('button', { name: 'Añadir a la progresión' }))
    expect(document.body.textContent).not.toBe(before)
    expect(count()).toBeGreaterThan(0)
  })

  it('shows three hallazgos and the full panel in a popover', () => {
    renderApp()
    const next = screen.getByRole('region', { name: /Puede seguir/ })
    expect(within(next).getAllByRole('button', { name: /^Añadir a la progresión: / })).toHaveLength(3)
    fireEvent.click(within(next).getByRole('button', { name: 'Ver todas' }))
    const dialog = screen.getByRole('dialog', { name: 'Ver todas las sugerencias' })
    expect(within(dialog).getByRole('heading', { name: 'Puede seguir' })).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('flags an invalid chord and keeps the last valid one', () => {
    renderApp()
    type('Zzz')
    expect(screen.getByRole('alert').textContent).toBe('No reconozco ese acorde')
    expect(hero()).toBe('Am7')
  })
})
