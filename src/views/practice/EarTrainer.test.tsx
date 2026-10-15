// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from '../../test/renderApp'

afterEach(cleanup)

function openEar() {
  renderApp('#practice')
  fireEvent.click(screen.getAllByRole('button', { name: 'Más' }).at(-1)!)
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
    // A fixed random: the first interval at level 1 (a major 3rd) is asked.
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    openEar()
    fireEvent.click(screen.getByRole('button', { name: 'Intervalos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
    fireEvent.click(within(screen.getByRole('group', { name: '¿Qué intervalo suena?' })).getByRole('button', { name: /5\.ª justa/ }))
    expect(screen.getByRole('status').textContent).toBe('Era 3.ª mayor — tú dijiste 5.ª justa.')
    expect(screen.getByRole('button', { name: 'Oír la diferencia' })).toBeTruthy()
    random.mockRestore()
  })
})
