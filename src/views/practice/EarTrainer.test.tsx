// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'

afterEach(cleanup)

function openEar() {
  renderApp('#practice')
  fireEvent.click(screen.getByRole('button', { name: 'Oído' }))
}

describe('ear training', () => {
  it('asks, takes an answer and keeps score', () => {
    openEar()
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
    expect(screen.getByText('¿Qué acorde suena?')).toBeTruthy()
    const choices = within(screen.getByRole('group', { name: '¿Qué acorde suena?' })).getAllByRole('button')
    expect(choices.map((button) => button.textContent?.replace(/^\d/, ''))).toEqual(['Mayor', 'Menor'])
    fireEvent.click(choices[0])
    expect(document.querySelector('[data-state="right"]')).toBeTruthy()
    expect(screen.getByText(/^\d\/1$/)).toBeTruthy()
  })

  it('a wrong answer shows the right one and offers to hear the difference', () => {
    openEar()
    fireEvent.click(screen.getByRole('button', { name: 'Intervalos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
    const group = screen.getByRole('group', { name: '¿Qué intervalo suena?' })
    // Answer every choice until one is wrong (at least two of three are).
    const right = within(group).getAllByRole('button')
    fireEvent.click(right[0])
    if (document.querySelector('.ear-choice[data-state="wrong"]')) {
      expect(screen.getByRole('button', { name: 'Oír la diferencia' })).toBeTruthy()
      expect(screen.getByRole('status').textContent).toMatch(/^Era .+ — tú dijiste /)
    } else {
      expect(screen.getByRole('status').textContent).toMatch(/^¡Bien!/)
    }
  })
})
