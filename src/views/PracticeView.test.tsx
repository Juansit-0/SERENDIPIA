// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from '../test/renderApp'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function openPractice() {
  renderApp()
  fireEvent.click(screen.getByRole('button', { name: 'Práctica' }))
}

describe('change trainer', () => {
  it('starts from the first two chords of the progression with chained shapes', () => {
    openPractice()
    expect((screen.getByLabelText('Acorde A') as HTMLInputElement).value).toBe('C')
    expect((screen.getByLabelText('Acorde B') as HTMLInputElement).value).toBe('G')
    expect(screen.getByText('x 3 2 0 1 0')).toBeTruthy()
  })

  it('flags an unknown chord and blocks the start', () => {
    openPractice()
    fireEvent.change(screen.getByLabelText('Acorde B'), { target: { value: 'Hzz' } })
    expect(screen.getAllByRole('alert').map((alert) => alert.textContent)).toContain('Acorde no reconocido')
    expect(screen.getByRole('button', { name: 'Empezar' })).toHaveProperty('disabled', true)
  })

  it('counts taps for one minute and keeps the record', () => {
    vi.useFakeTimers()
    openPractice()
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
    const tap = screen.getByRole('button', { name: '¡Cambio!' })
    for (let index = 0; index < 5; index += 1) fireEvent.click(tap)
    fireEvent.keyDown(window, { code: 'Space' })
    act(() => {
      vi.advanceTimersByTime(61000)
    })
    expect(screen.getByText(/6 cambios por minuto/)).toBeTruthy()
    expect(screen.getByText('¡Nuevo récord!')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Empezar' })).toBeTruthy()
  })
})
