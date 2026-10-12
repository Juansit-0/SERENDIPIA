// @vitest-environment jsdom
import { fireEvent, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup } from '@testing-library/react'
import { renderApp } from '../test/renderApp'

afterEach(cleanup)

function grid() {
  return screen.getAllByRole('group', { name: /mástil/i })[0]
}

describe('fretboard keyboard navigation', () => {
  it('exposes a single tab stop for the whole grid', () => {
    renderApp()
    const tabbable = within(grid())
      .getAllByRole('button')
      .filter((button) => button.tabIndex === 0)
    expect(tabbable).toHaveLength(1)
  })

  it('moves focus with the arrow keys', () => {
    renderApp()
    const board = grid()
    const start = within(board).getAllByRole('button').find((button) => button.tabIndex === 0)!
    start.focus()
    fireEvent.keyDown(start, { key: 'ArrowRight' })
    const afterRight = document.activeElement as HTMLElement
    expect(afterRight).not.toBe(start)
    expect(afterRight.tabIndex).toBe(0)
    expect(afterRight.getAttribute('aria-label')).toMatch(/traste 1/)
    fireEvent.keyDown(afterRight, { key: 'ArrowDown' })
    expect((document.activeElement as HTMLElement).getAttribute('aria-label')).toMatch(/^B traste 1/)
    fireEvent.keyDown(document.activeElement!, { key: 'Home' })
    expect((document.activeElement as HTMLElement).getAttribute('aria-label')).toMatch(/^B /)
    expect(start.tabIndex).toBe(-1)
  })

  it('describes fretted strings instead of calling them open', () => {
    renderApp()
    const labels = within(grid())
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label') ?? '')
    // Default chord is Am7 (x02010): the B string is fretted at 1.
    expect(labels.some((l) => l.startsWith('B pisada en el traste 1'))).toBe(true)
    expect(labels.some((l) => l.startsWith('E apagada'))).toBe(true)
  })
})
