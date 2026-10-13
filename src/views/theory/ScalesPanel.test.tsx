// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'

afterEach(cleanup)

function openScales() {
  renderApp('#theory')
  fireEvent.click(screen.getByRole('button', { name: 'Escalas' }))
}

describe('Teoría · Escalas', () => {
  it('shows the key scale over the neck with the current chord filled in', () => {
    openScales()
    const board = screen.getByRole('group', { name: 'Mástil con la escala: C Mayor' })
    // C major over 6 strings × frets 0–15: every dot is a scale note.
    expect(within(board).getAllByRole('button').length).toBeGreaterThan(50)
    expect(board.querySelectorAll('.sv-dot.is-root').length).toBeGreaterThan(4)
    // The Acorde view's chord (Am7): its tones are filled.
    expect(screen.getByText(/Sobre/).textContent).toContain('Am7')
    expect(board.querySelectorAll('.sv-dot.is-chord').length).toBeGreaterThan(10)
  })

  it('a pentatonic has five positions, and choosing one dims the rest of the neck', () => {
    openScales()
    fireEvent.change(screen.getByLabelText('Escala'), { target: { value: 'pentMinor' } })
    const positions = within(screen.getByRole('group', { name: 'Posición' })).getAllByRole('button')
    expect(positions.map((button) => button.textContent)).toEqual(['Todo', '1', '2', '3', '4', '5'])
    fireEvent.click(positions[3])
    expect(document.querySelectorAll('.sv-dot.is-dim').length).toBeGreaterThan(0)
    expect(document.querySelectorAll('.sv-cell.in-box').length).toBeGreaterThan(0)
  })
})
