// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'

afterEach(cleanup)

const openTuner = () => fireEvent.click(screen.getByRole('button', { name: 'Afinador' }))

describe('tuner', () => {
  it('lists the strings of the chosen tuning and switches tuning for the whole app', () => {
    renderApp()
    openTuner()
    expect(screen.getByRole('button', { name: 'Cuerda 6: E · Mi' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Afinación'), { target: { value: 'drop-d' } })
    expect(screen.getByRole('button', { name: 'Cuerda 6: D · Re' })).toBeTruthy()
  })

  it('a string can be fixed as the target and released again', () => {
    renderApp()
    openTuner()
    const fifth = screen.getByRole('button', { name: 'Cuerda 5: A · La' })
    fireEvent.click(fifth)
    expect(fifth.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('Cuerdas · Cuerda 5')).toBeTruthy()
    fireEvent.click(fifth)
    expect(fifth.getAttribute('aria-pressed')).toBe('false')
  })

  it('explains when the microphone is not available', async () => {
    renderApp()
    openTuner()
    fireEvent.click(screen.getByRole('button', { name: 'Activar micrófono' }))
    expect(await screen.findByText(/no deja usar el micrófono/)).toBeTruthy()
  })
})
